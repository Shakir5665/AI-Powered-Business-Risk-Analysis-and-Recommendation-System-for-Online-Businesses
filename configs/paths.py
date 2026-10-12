"""
Project Paths

Centralized file and directory paths for the project.

Project:
AI-Powered Business Risk Analysis
and Recommendation System
"""

import os
from pathlib import Path

# ==================================================
# Project Root
# ==================================================

PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Load environment variables from .env if available
_env_path = PROJECT_ROOT / ".env"
if _env_path.is_file():
    try:
        with open(_env_path, "r", encoding="utf-8") as _f:
            for _line in _f:
                _line = _line.strip()
                if _line and not _line.startswith("#") and "=" in _line:
                    _k, _v = _line.split("=", 1)
                    _k, _v = _k.strip(), _v.strip().strip("'\"")
                    if _k not in os.environ:
                        os.environ[_k] = _v
    except Exception:
        pass

# ==================================================
# Data Directories
# ==================================================

DATA_DIR = PROJECT_ROOT / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
FINAL_DATA_DIR = DATA_DIR / "final"

# ==================================================
# Dataset Files
# ==================================================

RAW_DATASET_PATH = RAW_DATA_DIR / "dataset.jsonl"
PROCESSED_DATASET_PATH = PROCESSED_DATA_DIR / "dataset.jsonl"
FINAL_DATASET_PATH = FINAL_DATA_DIR / "dataset.jsonl"
TRAIN_DATASET_PATH = PROCESSED_DATA_DIR / "train.jsonl"
VALIDATION_DATASET_PATH = PROCESSED_DATA_DIR / "validation.jsonl"
TEST_DATASET_PATH = PROCESSED_DATA_DIR / "test.jsonl"

# ==================================================
# Checkpoints
# ==================================================

CHECKPOINT_DIR = PROJECT_ROOT / "checkpoints"

# ==================================================
# Outputs
# ==================================================

OUTPUT_DIR = PROJECT_ROOT / "outputs"
LOG_DIR = OUTPUT_DIR / "logs"
REPORT_DIR = OUTPUT_DIR / "reports"
FIGURE_DIR = OUTPUT_DIR / "figures"

# ==================================================
# AI Model & Resources
# ==================================================

MODEL_VERSION = os.getenv("MODEL_VERSION", "v2").strip()
MODEL_DIR = PROJECT_ROOT / "models" / MODEL_VERSION
TOKENIZER_DIR = MODEL_DIR / "tokenizer"
RESOURCES_DIR = PROJECT_ROOT / "resources"

# ==================================================
# Recommendation Subsystem Paths
# ==================================================

RECOMMENDATION_DIR = PROJECT_ROOT / "core" / "recommendation"
RECOMMENDATION_RULES_DIR = RECOMMENDATION_DIR / "knowledge" / "rules"
RECOMMENDATION_TEMPLATES_DIR = RECOMMENDATION_DIR / "templates"