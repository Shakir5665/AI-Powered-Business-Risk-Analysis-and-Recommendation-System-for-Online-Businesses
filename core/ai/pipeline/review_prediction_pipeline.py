"""
Review Prediction Pipeline

Coordinates AI prediction for an entire collection of reviews.

Responsibilities
----------------
- Accept multiple scraped reviews
- Invoke Predictor for each review
- Return all formatted predictions

Project:
AI-Powered Business Risk Analysis
and Recommendation System
"""

from typing import List, Dict

from configs.model_config import INFERENCE_BATCH_SIZE
from core.ai.predictor import Predictor
from core.scraper.dto.scraped_review import ScrapedReview

from core.common.logger import logger


class ReviewPredictionPipeline:
    """
    Executes AI prediction for a collection of reviews.
    """

    def __init__(self):

        logger.info(
            "Initializing ReviewPredictionPipeline..."
        )

        self._predictor = Predictor()

        logger.info(
            "ReviewPredictionPipeline initialized successfully."
        )

    # --------------------------------------------------

    def predict_reviews(
        self,
        reviews: List[ScrapedReview]
    ) -> List[Dict]:
        """
        Predict all reviews of a product.

        Parameters
        ----------
        reviews : List[ScrapedReview]

        Returns
        -------
        List[Dict]
        """

        logger.info(
            f"Predicting {len(reviews)} reviews..."
        )

        import os
        remote_gpu_url = os.getenv("REMOTE_GPU_URL", "").strip().rstrip("/")
        if remote_gpu_url and reviews:
            try:
                import httpx
                logger.info(f"⚡ [GPU OFFLOAD] Offloading {len(reviews)} reviews to remote Colab GPU: {remote_gpu_url}")
                batch_texts = [r.review_text for r in reviews if getattr(r, "review_text", "")]
                endpoint = f"{remote_gpu_url}/api/v1/analysis/predict-batch"
                resp = httpx.post(endpoint, json={"reviews": batch_texts}, timeout=180.0)
                if resp.status_code == 200:
                    data = resp.json()
                    preds = data.get("predictions", [])
                    if preds and len(preds) == len(batch_texts):
                        logger.info(f"⚡ [GPU OFFLOAD] Received {len(preds)} predictions from Colab GPU successfully!")
                        return preds
                logger.warning(f"Remote GPU returned status {resp.status_code}, falling back to local predictor.")
            except Exception as offload_err:
                logger.warning(f"Remote GPU offload warning: {offload_err}. Falling back to local predictor.")

        predictions = []

        batch_size = INFERENCE_BATCH_SIZE

        for i in range(0, len(reviews), batch_size):

            batch = reviews[i : i + batch_size]

            batch_reviews = [r.review_text for r in batch]

            batch_predictions = self._predictor.predict_batch(
                batch_reviews
            )

            predictions.extend(
                batch_predictions
            )

        logger.info(
            f"Finished predicting {len(predictions)} reviews."
        )

        return predictions