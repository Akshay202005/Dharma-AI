from pathlib import Path
import joblib

model = joblib.load(Path(__file__).resolve().parent / "models" / "emotion_baseline.joblib")

text = "i have an interview tomorrow and cant sleep"
probs = model.predict_proba([text])[0]
top3 = sorted(zip(model.classes_, probs), key=lambda x: -x[1])[:3]

for emotion, p in top3:
    print(f"{emotion}: {p:.2f}")