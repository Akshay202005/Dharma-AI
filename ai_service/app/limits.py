import time
from datetime import datetime, timedelta, timezone

# provider name -> epoch seconds when it should work again
_blocked_until: dict[str, float] = {}


class LimitReached(Exception):
    """Raised when every configured LLM provider is out of quota."""

    def __init__(self, resets_at_ms: int):
        super().__init__("All AI providers are rate limited")
        self.resets_at_ms = resets_at_ms


def is_rate_limit(exc) -> bool:
    """True when the error is an HTTP 429 (works for any openai-style SDK error)."""
    code = getattr(exc, "status_code", None)
    if code is None:
        code = getattr(getattr(exc, "response", None), "status_code", None)
    return code == 429


def _seconds_until_pacific_midnight() -> float:
    try:
        from zoneinfo import ZoneInfo
        tz = ZoneInfo("America/Los_Angeles")
    except Exception:  # Windows without the tzdata package
        tz = timezone(timedelta(hours=-8))
    now = datetime.now(tz)
    midnight = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    return (midnight - now).total_seconds()


def mark_limited(provider: str, exc) -> None:
    """Call when a provider answered 429. Works out when it comes back."""
    secs = None

    # 1) the provider may say it directly in a Retry-After header
    headers = getattr(getattr(exc, "response", None), "headers", None)
    if headers is not None:
        try:
            secs = float(headers.get("retry-after"))
        except (TypeError, ValueError):
            secs = None

    # 2) otherwise guess: daily quota resets at midnight Pacific, per-minute quota in ~60s
    if secs is None:
        text = str(exc).lower()
        if "perday" in text or "per day" in text:
            secs = _seconds_until_pacific_midnight()
        else:
            secs = 60.0

    _blocked_until[provider] = time.time() + max(secs, 1.0)


def is_blocked(provider: str) -> bool:
    return _blocked_until.get(provider, 0) > time.time()


def all_limited(providers: list[str]) -> bool:
    return all(is_blocked(p) for p in providers)


def next_reset_ms(providers: list[str]) -> int:
    """Earliest time any provider is back = when the chat can open again."""
    return int(min(_blocked_until[p] for p in providers) * 1000)