"""
Model Configuration

Project:
AI-Powered Business Risk Analysis
and Recommendation System
"""

# --------------------------------------------------
# Base Model
# --------------------------------------------------

MODEL_NAME = "FacebookAI/xlm-roberta-base"

# --------------------------------------------------
# Tokenization
# --------------------------------------------------

MAX_SEQUENCE_LENGTH = 256

# --------------------------------------------------
# XLM-R Architecture
# --------------------------------------------------

HIDDEN_SIZE = 768

# --------------------------------------------------
# Adapter Configuration
# --------------------------------------------------

ADAPTER_DIM = 128

ADAPTER_DROPOUT = 0.1
 
# --------------------------------------------------
# Classification Heads
# --------------------------------------------------

CLASSIFIER_DROPOUT = 0.1

NUM_SENTIMENT_CLASSES = 3

# ==================================================
# Backbone
# ==================================================

HIDDEN_SIZE = 768

FREEZE_BACKBONE = True

# ==================================================
# Confidence
# ==================================================

LOW_CONFIDENCE_THRESHOLD = 0.60

# ==================================================
# Inference Batching & Precision
# ==================================================

INFERENCE_BATCH_SIZE = 64

# Mini-batch sizes for inference engine (inside batch chunk)
INFERENCE_MINI_BATCH_GPU_LARGE = 256   # GPUs with >= 15 GB VRAM (e.g. Tesla T4, V100, A100)
INFERENCE_MINI_BATCH_GPU_SMALL = 128    # GPUs with < 15 GB VRAM (e.g. RTX 3060/3070/4060)
INFERENCE_MINI_BATCH_CPU = 32         # CPU execution fallback

# Mixed precision (GPU only)
USE_FP16_INFERENCE = True

