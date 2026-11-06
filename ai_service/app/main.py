import asyncio
import logging
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from openai import APIError
from pydantic import BaseModel, Field

from .constants import EMOTIONS, DEFAULT_EMOTION
from .emotion_classifier import detect_emotion
from .limits import LimitReached
from .llm import generate_response
from .safety import looks_like_crisis

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("dharma_ai")

app = FastAPI(title="Dharma AI Service")


# Every model is out of quota -> answer 429 with the time the first one comes back
@app.exception_handler(LimitReached)
async def limit_reached_handler(request, exc: LimitReached):
    return JSONResponse(
        status_code=429,
        content={"code": "LIMIT_REACHED", "resetsAt": exc.resets_at_ms},
    )


class HistoryItem(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    history: list[HistoryItem] = Field(default_factory=list, max_length=20)


class ChatResponse(BaseModel):
    emotion: str
    reply: str


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    # 1. Detect the emotion with the trained model
    crisis = looks_like_crisis(req.message)

    detected = None
    if not crisis:  # a wrong label here could mislead the reply
        try:
            detected = await asyncio.to_thread(detect_emotion, req.message)
        except Exception:
            logger.exception("Emotion classifier failed, falling back to the LLM's emotion")

    # 2. Generate Krishna's reply
    try:
        result = await generate_response(
            req.message,
            [item.model_dump() for item in req.history],
            emotion=detected["emotion"] if detected else None,
            crisis=crisis,
        )
    except APIError as e:
        logger.exception("LLM call failed")
        raise HTTPException(status_code=502, detail=f"LLM provider error: {e.__class__.__name__}")

    if not result["reply"]:
        raise HTTPException(status_code=502, detail="LLM returned an empty reply")

    # 3. Decide which emotion to save
    if crisis:
        emotion = "sadness"
    elif detected and detected["emotion"] != DEFAULT_EMOTION:
        emotion = detected["emotion"]
    elif result.get("emotion") in EMOTIONS:
        emotion = result["emotion"]
    else:
        emotion = DEFAULT_EMOTION

    if detected:
        logger.info("emotion=%s confidence=%.2f", detected["emotion"], detected["confidence"])
    if crisis:
        logger.info("crisis phrase detected")

    return ChatResponse(emotion=emotion, reply=result["reply"])