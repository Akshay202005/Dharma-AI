import json
import logging
import re

from openai import APIError, AsyncOpenAI

from . import limits
from .config import settings
from .constants import DEFAULT_EMOTION, EMOTIONS
from .prompts import KRISHNA_SYSTEM_PROMPT

logger = logging.getLogger("dharma_ai")

# names used to remember which model is rate limited (see limits.py)
PRIMARY = "primary"
FALLBACK = "fallback"

# max_retries=0 + a short timeout: if Gemini is struggling, switch to Groq quickly
# instead of making the user wait through the SDK's automatic retries
primary_client = AsyncOpenAI(
    api_key=settings.api_key, base_url=settings.base_url, timeout=15, max_retries=0
)
fallback_client = (
    AsyncOpenAI(
        api_key=settings.fallback_api_key,
        base_url=settings.fallback_base_url,
        timeout=20,
        max_retries=0,
    )
    if settings.has_fallback
    else None
)


def _unescape(s: str) -> str:
    """Turn a JSON-escaped string body (\\n, \\", \\u0915...) back into normal text."""
    try:
        return json.loads(f'"{s}"')
    except json.JSONDecodeError:
        return s.replace('\\"', '"').replace("\\n", " ").strip()


def _salvage(text: str) -> dict | None:
    """Recover emotion + reply from broken or cut-off JSON using regex."""
    reply_match = re.search(r'"reply"\s*:\s*"((?:[^"\\]|\\.)*)', text, re.DOTALL)
    if not reply_match:
        return None

    reply = _unescape(reply_match.group(1)).strip()

    # If the text was cut off mid-sentence, trim back to the last full sentence
    if reply and reply[-1] not in ".!?।…":
        cut = max(reply.rfind(c) for c in ".!?।")
        if cut > 40:
            reply = reply[: cut + 1]

    emotion_match = re.search(r'"emotion"\s*:\s*"([^"]*)"', text)
    emotion = emotion_match.group(1) if emotion_match else DEFAULT_EMOTION
    return {"emotion": emotion, "reply": reply}


def parse_llm_output(raw: str) -> dict:
    """Turn the model's text into {"emotion", "reply"}. Never raises, never leaks raw JSON."""
    text = raw.strip()
    # Remove ```json ... ``` fences if the model added them anyway
    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text).strip()

    data = None

    # 1) Clean JSON
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        # 2) JSON block surrounded by extra text
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                data = json.loads(match.group())
            except json.JSONDecodeError:
                pass

    # 3) Broken or truncated JSON: rescue the fields with regex
    if not isinstance(data, dict):
        data = _salvage(text)

    # 4) No JSON at all: treat the whole text as the reply
    if not isinstance(data, dict):
        return {"emotion": DEFAULT_EMOTION, "reply": raw.strip()}

    emotion = str(data.get("emotion", "")).strip().lower()
    if emotion not in EMOTIONS:
        emotion = DEFAULT_EMOTION

    return {"emotion": emotion, "reply": str(data.get("reply", "")).strip()}


async def _call(client: AsyncOpenAI, model: str, messages: list[dict]):
    return await client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=0.8,
        max_tokens=1500,
        response_format={"type": "json_object"},
    )


def _emotion_hint(emotion: str | None) -> str | None:
    # No hint when the detector was unsure ("other"): Krishna just reads the message himself
    if not emotion or emotion == DEFAULT_EMOTION:
        return None
    return (
        f"Context from our emotion detector: the user is probably feeling '{emotion}'. "
        "Treat this as a hint, not a fact. If the user's own words clearly point to a "
        "different feeling, trust their words. Never mention the detector, a label or a score. "
        "Keep the same JSON output format."
    )


async def generate_response(
    message: str,
    history: list[dict] | None = None,
    emotion: str | None = None,
    crisis=False,
) -> dict:
    """Try Gemini first; if it fails, try Groq. Returns {"emotion", "reply"}.

    Raises limits.LimitReached when every model is out of quota (HTTP 429)."""
    system_prompt = KRISHNA_SYSTEM_PROMPT
    if crisis:
        system_prompt += (
            "\n\nThe user's latest message may signal thoughts of self-harm. "
            "Follow the self-harm rule above exactly."
        )
    else:
        hint = _emotion_hint(emotion)
        if hint:
            system_prompt = f"{system_prompt}\n\n{hint}"

    messages = [
        {"role": "system", "content": system_prompt},
        *(history or []),
        {"role": "user", "content": message},
    ]

    # (name, client, model) in the order we try them
    providers = [(PRIMARY, primary_client, settings.model)]
    if fallback_client:
        providers.append((FALLBACK, fallback_client, settings.fallback_model))

    response = None
    last_error = None
    for name, client, model in providers:
        if limits.is_blocked(name):
            continue  # known to be out of quota: don't waste a call
        try:
            response = await _call(client, model, messages)
            break
        except APIError as e:
            last_error = e
            if limits.is_rate_limit(e):  # 429 = quota/rate limit. 503 and timeouts are NOT limits
                limits.mark_limited(name, e)
                logger.warning("%s model hit its rate limit", name)
            else:
                logger.warning("%s model failed (%s)", name, e.__class__.__name__)

    if response is None:
        names = [p[0] for p in providers]
        if limits.all_limited(names):
            raise limits.LimitReached(limits.next_reset_ms(names))
        if last_error:
            raise last_error  # main.py turns this into a 502
        raise RuntimeError("No LLM provider available")

    choice = response.choices[0]
    if choice.finish_reason == "length":
        logger.warning("LLM output was cut off (hit max_tokens)")

    return parse_llm_output(choice.message.content or "")