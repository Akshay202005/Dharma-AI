from pathlib import Path
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import pipeline

MODEL_DIR = Path(__file__).resolve().parent / "models" / "dharma-emotion-final"

# Loaded once at startup, not on every request (loading is the slow part)
clf = pipeline("text-classification", model=str(MODEL_DIR), top_k=3)

app = FastAPI()

class Prompt(BaseModel):
    text: str

@app.post("/predict")
def predict(prompt: Prompt):
    text = prompt.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="text is empty")

    result = clf(text[:500])
    if isinstance(result[0], list):      # some library versions nest the list
        result = result[0]

    top3 = [{"emotion": r["label"], "score": round(r["score"], 3)} for r in result]
    best = top3[0]

    return {
        "emotion": best["emotion"],
        "confidence": best["score"],
        "top3": top3,
        "uncertain": best["score"] < 0.5,   # starting threshold, tune it later
    }