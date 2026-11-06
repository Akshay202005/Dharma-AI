import re

# Extend this with phrases your own users write (including Hinglish)
_CRISIS_PATTERNS = [
    r"\bend (it all|my life)\b",
    r"\bkill myself\b",
    r"\bsuicid",
    r"\bwant to die\b",
    r"\bdon'?t want to (live|be here|exist)\b",
    r"\bbetter off without me\b",
    r"\bno reason to live\b",
    r"\b(hurt|harm) myself\b",
    r"\bself[- ]?harm\b",
]

def looks_like_crisis(text: str) -> bool:
    t = text.lower().replace("’", "'")
    return any(re.search(p, t) for p in _CRISIS_PATTERNS)