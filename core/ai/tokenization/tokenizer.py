"""
XLM-R Tokenizer

Tokenizes multilingual reviews for XLM-RoBERTa.

Project:
AI-Powered Business Risk Analysis
and Recommendation System
"""

from pathlib import Path
from typing import Dict, List

from transformers import AutoTokenizer

from configs.model_config import MAX_SEQUENCE_LENGTH
from configs.paths import TOKENIZER_DIR

from core.common.logger import logger


class ReviewTokenizer:
    """
    Wrapper around Hugging Face XLM-R tokenizer.
    """

    def __init__(self):

        self.tokenizer = AutoTokenizer.from_pretrained(
             TOKENIZER_DIR
        )

        logger.info(
             f"Loaded tokenizer from: {TOKENIZER_DIR}"
        )

    # --------------------------------------------------
    # Tokenize Single Review
    # --------------------------------------------------

    def tokenize(
    self,
    review: str
) -> Dict:

        encoded = self.tokenizer(
            review,
            padding="max_length",
            truncation=True,
            max_length=MAX_SEQUENCE_LENGTH,
            return_attention_mask=True,
            return_tensors="pt"
        )

        input_ids = encoded["input_ids"][0]
        attention_mask = encoded["attention_mask"][0]


        return {

            "input_ids": input_ids,

            "attention_mask": attention_mask

        }

    # --------------------------------------------------
    # Tokenize Batch of Reviews
    # --------------------------------------------------

    def tokenize_batch(
        self,
        reviews: List[str]
    ) -> Dict:

        return self.tokenizer(

            reviews,

            padding="longest",

            truncation=True,

            max_length=MAX_SEQUENCE_LENGTH,

            return_attention_mask=True,

            return_tensors="pt"

        )

    # --------------------------------------------------
    # Decode Token IDs
    # --------------------------------------------------

    def decode(
        self,
        input_ids
    ) -> str:

        return self.tokenizer.decode(

            input_ids,

            skip_special_tokens=True

        )

    # --------------------------------------------------
    # Save Tokenizer
    # --------------------------------------------------

    def save(
        self,
        path: str
    ):

        path = Path(path)

        path.mkdir(

            parents=True,

            exist_ok=True

        )

        self.tokenizer.save_pretrained(path)

        logger.info(

            f"Tokenizer saved to {path}"

        )

    # --------------------------------------------------
    # Load Tokenizer
    # --------------------------------------------------

    def load(
        self,
        path: str
    ):

        self.tokenizer = AutoTokenizer.from_pretrained(
            path
        )

        logger.info(

            f"Tokenizer loaded from {path}"

        )