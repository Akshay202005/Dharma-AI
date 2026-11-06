from pathlib import Path
import pandas as pd
import joblib
from sklearn.metrics import accuracy_score, classification_report

BASE_DIR = Path(__file__).resolve().parent
model = joblib.load(BASE_DIR / "models" / "emotion_baseline.joblib")
rw = pd.read_csv(BASE_DIR / "datasets" / "realworld_test.csv")

rw["text"] = rw["sentence"].str.lower()
rw["pred"] = model.predict(rw["text"])
rw["conf"] = model.predict_proba(rw["text"]).max(axis=1)

print("Real-world accuracy:", round(accuracy_score(rw["emotion"], rw["pred"]), 3))

# Show only the mistakes
wrong = rw[rw["emotion"] != rw["pred"]]
print(wrong[["sentence", "emotion", "pred", "conf"]].to_string(index=False))

train_df = pd.read_csv(BASE_DIR / "datasets" / "emotion_dataset_20.csv")
train_texts = set(train_df["cleaned_text"])

print("\nRows in test file:", len(rw))
print("Exact overlap with training data:", rw["text"].isin(train_texts).sum())
print("Average confidence:", round(rw["conf"].mean(), 2))
print("\nLowest-confidence predictions:")
print(rw.sort_values("conf")[["sentence", "pred", "conf"]].head(5).to_string(index=False))