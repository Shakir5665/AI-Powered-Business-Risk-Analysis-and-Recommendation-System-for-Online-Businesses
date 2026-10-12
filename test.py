r"""
Quick Model Inference Test Script
=================================
Switch models quickly via terminal before running:
    # PowerShell (Windows):
    $env:MODEL_VERSION="v1"; python test.py
    $env:MODEL_VERSION="v2"; python test.py

    # Or with venv python:
    $env:MODEL_VERSION="v1"; .\venv\Scripts\python.exe test.py
    $env:MODEL_VERSION="v2"; .\venv\Scripts\python.exe test.py


    .\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000

Or define MODEL_VERSION in your .env file:
    MODEL_VERSION=v1
"""

import sys
import json

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from configs.paths import MODEL_VERSION, MODEL_DIR
from core.ai.predictor import Predictor


def main():
    print("\n" + "=" * 60)
    print(f"[*] Active Model Version: {MODEL_VERSION.upper()}")
    print(f"[*] Model Directory:      {MODEL_DIR}")
    print("=" * 60 + "\n")

    predictor = Predictor()

    sample_reviews = [
        "Delivery was very late but product quality is excellent.",
        "Terrible experience, battery stopped working after two days.",
    ]

    for review in sample_reviews:
        print(f"\n>> Review: \"{review}\"")
        result = predictor.predict(review)
        print(">> Inference Result:")
        print(json.dumps(result, indent=2, ensure_ascii=False))
        print("-" * 60)


if __name__ == "__main__":
    main()
