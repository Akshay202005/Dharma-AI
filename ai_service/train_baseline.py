from pathlib import Path
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
from sklearn.metrics import classification_report

# Paths are built from this file's location, so it works no matter where you run it from
BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "datasets" / "emotion_dataset_20.csv"
MODEL_DIR = BASE_DIR / "models"
MODEL_DIR.mkdir(exist_ok=True)

# Load data and remove duplicate sentences (some had conflicting labels)
df = pd.read_csv(DATA_PATH)
df = df.drop_duplicates("cleaned_text", keep=False)

# 80% train, 20% test, with each emotion split in the same proportion
train, test = train_test_split(
    df, test_size=0.2, stratify=df["emotion"], random_state=42
)

# Pipeline: text -> TF-IDF numbers -> classifier
model = make_pipeline(
    TfidfVectorizer(ngram_range=(1, 2), min_df=2),
    LogisticRegression(max_iter=1000, class_weight="balanced"),
)

print("Training...")
model.fit(train["cleaned_text"], train["emotion"])

# Testing on data the model has never seen
print(classification_report(test["emotion"], model.predict(test["cleaned_text"])))

# Save the trained model
joblib.dump(model, MODEL_DIR / "emotion_baseline.joblib")
print("Saved to", MODEL_DIR / "emotion_baseline.joblib")