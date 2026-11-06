from pathlib import Path
import pandas as pd
from transformers import pipeline

BASE = Path(__file__).resolve().parent
clf = pipeline(
    "text-classification",
    model=str(BASE / "models" / "dharma-emotion-final"),
    top_k=2,   # top 2 so we can also see the gap between first and second
)

# Both test files together: your 40 earlier rows + the new messy ones
files = [BASE / "datasets" / "realworld_test.csv", BASE / "datasets" / "messy_test.csv"]
df = pd.concat([pd.read_csv(f) for f in files], ignore_index=True)

out = clf(df["sentence"].tolist())          # raw text, same as the live service
df["pred"] = [o[0]["label"] for o in out]
df["conf"] = [o[0]["score"] for o in out]
df["margin"] = [o[0]["score"] - o[1]["score"] for o in out]
df["correct"] = df["pred"] == df["emotion"]

print(f"Overall accuracy: {df['correct'].mean():.0%} on {len(df)} messages\n")

print("threshold | kept   | right when kept | wrong ones let through")
for t in [0.4, 0.5, 0.6, 0.7, 0.8, 0.9]:
    kept = df[df["conf"] >= t]
    if kept.empty:
        continue
    print(f"{t:>9} | {len(kept)/len(df):>5.0%} | {kept['correct'].mean():>14.0%} | {(~kept['correct']).sum():>3}")

print("\nConfident but wrong (confidence 0.6 or more):")
wrong = df[(~df["correct"]) & (df["conf"] >= 0.6)]
print(wrong[["sentence", "emotion", "pred", "conf"]].round(2).to_string(index=False))