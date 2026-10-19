"""
Inference Engine

Runs the complete AI inference pipeline.

Responsibilities
----------------
- Preprocess review
- Tokenize review
- Run model inference
- Return raw logits

Project:
AI-Powered Business Risk Analysis
and Recommendation System
"""

from typing import Dict, List, Any

import torch

from core.ai.preprocessing.preprocessor import ReviewPreprocessor
from core.ai.inference.model_loader import ModelLoader
from configs.model_config import (
    INFERENCE_MINI_BATCH_GPU_LARGE,
    INFERENCE_MINI_BATCH_GPU_SMALL,
    INFERENCE_MINI_BATCH_CPU,
    USE_FP16_INFERENCE
)

from core.common.logger import logger


class InferenceEngine:
    """
    Executes AI inference.
    """

    def __init__(self, loader):

        self.loader = loader

        self.preprocessor = ReviewPreprocessor()

    # --------------------------------------------------

    def _get_default_mini_batch_size(self) -> int:
        """
        Determines optimal mini-batch size based on available device and VRAM.
        """
        if self.loader.device.type == "cuda" and torch.cuda.is_available():
            try:
                device_idx = self.loader.device.index if self.loader.device.index is not None else torch.cuda.current_device()
                vram_gb = torch.cuda.get_device_properties(device_idx).total_memory / (1024 ** 3)
                if vram_gb >= 15.0:
                    return INFERENCE_MINI_BATCH_GPU_LARGE
                return INFERENCE_MINI_BATCH_GPU_SMALL
            except Exception:
                return INFERENCE_MINI_BATCH_GPU_SMALL
        return INFERENCE_MINI_BATCH_CPU

    # --------------------------------------------------

    def predict(
        self,
        review: str
    ) -> Dict[str, torch.Tensor]:

        # -----------------------------
        # Preprocess
        # -----------------------------

        review = self.preprocessor.preprocess(

            review

        )

        # -----------------------------
        # Tokenize
        # -----------------------------

        tokens = self.loader.tokenizer_instance.tokenize(

            review

        )

        input_ids = tokens["input_ids"].unsqueeze(0).to(

            self.loader.device

        )

        attention_mask = tokens["attention_mask"].unsqueeze(0).to(

            self.loader.device

        )

        # -----------------------------
        # Model Inference
        # -----------------------------

        is_cuda = (self.loader.device.type == "cuda" and torch.cuda.is_available())

        with torch.no_grad():

            if is_cuda and USE_FP16_INFERENCE:
                with torch.amp.autocast("cuda"):
                    outputs = self.loader.model_instance(
                        input_ids=input_ids,
                        attention_mask=attention_mask
                    )
            else:
                outputs = self.loader.model_instance(
                    input_ids=input_ids,
                    attention_mask=attention_mask
                )

        return outputs

    # --------------------------------------------------

    def predict_batch(
        self,
        reviews: List[str]
    ) -> Dict[str, torch.Tensor]:

        if not reviews:
            return {}

        # -----------------------------
        # Preprocess
        # -----------------------------

        preprocessed_reviews = [
            self.preprocessor.preprocess(review)
            for review in reviews
        ]

        # -----------------------------
        # Sort by Length for Dynamic Padding Efficiency
        # -----------------------------
        indexed_reviews = sorted(
            enumerate(preprocessed_reviews),
            key=lambda item: len(item[1]),
            reverse=True
        )

        mini_batch_size = self._get_default_mini_batch_size()
        chunk_outputs_list = []
        is_cuda = (self.loader.device.type == "cuda" and torch.cuda.is_available())

        # -----------------------------
        # Mini-Batch Forward Passes with OOM Recovery
        # -----------------------------
        i = 0
        while i < len(indexed_reviews):
            chunk_items = indexed_reviews[i : i + mini_batch_size]
            chunk_texts = [text for _, text in chunk_items]

            try:
                tokens = self.loader.tokenizer_instance.tokenize_batch(
                    chunk_texts
                )

                input_ids = tokens["input_ids"].to(
                    self.loader.device
                )

                attention_mask = tokens["attention_mask"].to(
                    self.loader.device
                )

                with torch.no_grad():
                    if is_cuda and USE_FP16_INFERENCE:
                        with torch.amp.autocast("cuda"):
                            chunk_out = self.loader.model_instance(
                                input_ids=input_ids,
                                attention_mask=attention_mask
                            )
                    else:
                        chunk_out = self.loader.model_instance(
                            input_ids=input_ids,
                            attention_mask=attention_mask
                        )

                # Move outputs to CPU and convert to FP32 to free GPU VRAM immediately
                cpu_chunk_out = {
                    k: (v.detach().cpu().to(torch.float32) if isinstance(v, torch.Tensor) else v)
                    for k, v in chunk_out.items()
                }
                chunk_outputs_list.append((chunk_items, cpu_chunk_out))
                i += len(chunk_items)

            except (torch.cuda.OutOfMemoryError, RuntimeError) as oom_err:
                if is_cuda and "out of memory" in str(oom_err).lower() and mini_batch_size > 1:
                    torch.cuda.empty_cache()
                    mini_batch_size = max(1, mini_batch_size // 2)
                    logger.warning(
                        f"[InferenceEngine] CUDA OOM encountered. Halving mini-batch size to {mini_batch_size} and retrying..."
                    )
                else:
                    raise oom_err

        # -----------------------------
        # Reconstruct Outputs in Original Order
        # -----------------------------
        total_n = len(reviews)
        if not chunk_outputs_list:
            return {}

        first_chunk = chunk_outputs_list[0][1]
        merged_outputs: Dict[str, torch.Tensor] = {}

        for key, sample_val in first_chunk.items():
            if isinstance(sample_val, torch.Tensor):
                shape = (total_n,) + sample_val.shape[1:]
                merged_tensor = torch.empty(shape, dtype=sample_val.dtype)

                for chunk_items, chunk_out in chunk_outputs_list:
                    tensor_slice = chunk_out[key]
                    for local_idx, (orig_idx, _) in enumerate(chunk_items):
                        merged_tensor[orig_idx] = tensor_slice[local_idx]

                merged_outputs[key] = merged_tensor
            else:
                merged_outputs[key] = sample_val

        return merged_outputs

    # --------------------------------------------------

    def get_single_output(
        self,
        outputs: Dict[str, torch.Tensor],
        index: int
    ) -> Dict[str, torch.Tensor]:
        """
        Extract the outputs for a single review at the given index from the batch outputs.
        """
        single_output = {}
        for k, v in outputs.items():
            if isinstance(v, torch.Tensor):
                single_output[k] = v[index:index+1]
            else:
                single_output[k] = v
        return single_output