"""
Model Loader

Loads the production AI model and all required
components for inference.

Responsibilities
----------------
- Load trained model
- Load tokenizer
- Load encoders
- Configure inference device
- Set model to evaluation mode

Project:
AI-Powered Business Risk Analysis
and Recommendation System
"""

from pathlib import Path

import torch

from core.ai.models.business_risk_model import BusinessRiskModel
from core.ai.tokenization.tokenizer import ReviewTokenizer
from core.ai.encoding.sentiment_encoder import SentimentEncoder
from core.ai.encoding.aspect_encoder import AspectEncoder

from configs.paths import MODEL_DIR

from core.common.logger import logger


class ModelLoader:
    """
    Loads and initializes all AI inference components.
    """

    def __init__(self):

        logger.info("Initializing AI Model Loader...")

        # ------------------------------------------
        # Device
        # ------------------------------------------

        self.device = torch.device(
            "cuda" if torch.cuda.is_available() else "cpu"
        )

        logger.info(f"Inference Device: {self.device}")

        # ------------------------------------------
        # Encoders
        # ------------------------------------------

        self.sentiment_encoder = SentimentEncoder()

        self.aspect_encoder = AspectEncoder()

        # ------------------------------------------
        # Tokenizer
        # ------------------------------------------

        self.tokenizer = ReviewTokenizer()

        # ------------------------------------------
        # Model
        # ------------------------------------------

        self.model = BusinessRiskModel(
            num_aspect_classes=len(
                self.aspect_encoder.classes
            )
        )

        checkpoint_path = Path(MODEL_DIR) / "best_model.pt"

        logger.info(f"Loading model checkpoint from: {checkpoint_path}")

        checkpoint = torch.load(
            checkpoint_path,
            map_location=self.device
        )

        self.model.load_state_dict(
            checkpoint["model_state_dict"]
        )

        self.model.to(self.device)

        self.model.eval()

        logger.info("Production model loaded successfully.")

    # --------------------------------------------------

    @property
    def device(self):
        return self._device

    @device.setter
    def device(self, value):
        self._device = value

    # --------------------------------------------------

    @property
    def model_instance(self):
        return self.model

    # --------------------------------------------------

    @property
    def tokenizer_instance(self):
        return self.tokenizer

    # --------------------------------------------------

    @property
    def sentiment_encoder_instance(self):
        return self.sentiment_encoder

    # --------------------------------------------------

    @property
    def aspect_encoder_instance(self):
        return self.aspect_encoder