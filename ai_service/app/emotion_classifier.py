from pathlib import Path
from transformers import pipeline
from .constants import EMOTIONS, DEFAULT_EMOTION

# .parent = app/, .parent.parent = ai_service/
MODEL_DIR = Path(__file__).resolve().parent.parent / "models" / "dharma-emotion-final"

if not MODEL_DIR.is_dir():
    raise FileNotFoundError(f"Emotion model folder not found: {MODEL_DIR}")

CONFIDENCE_THRESHOLD = 0.8

_clf = pipeline("text-classification", model=str(MODEL_DIR), top_k=2)
MARGIN = 0.25   # starting value, tune it

def detect_emotion(text: str) -> dict:
    result = _clf(text.strip()[:500])
    if isinstance(result[0], list):
        result = result[0]
    best, second = result[0], result[1]
    emotion, score = best["label"], float(best["score"])
    margin = score - float(second["score"])

    if emotion not in EMOTIONS or score < CONFIDENCE_THRESHOLD or margin < MARGIN:
        emotion = DEFAULT_EMOTION
    return {"emotion": emotion, "confidence": score, "margin": margin}