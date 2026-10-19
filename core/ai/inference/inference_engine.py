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

import math
import time
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

        total_n = len(reviews)
        start_time = time.perf_counter()

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

        # Hardware & Precision Observability
        if is_cuda:
            try:
                device_idx = self.loader.device.index if self.loader.device.index is not None else torch.cuda.current_device()
                gpu_name = torch.cuda.get_device_name(device_idx)
                vram_total_gb = torch.cuda.get_device_properties(device_idx).total_memory / (1024 ** 3)
                torch.cuda.reset_peak_memory_stats(device_idx)
            except Exception:
                device_idx = 0
                gpu_name = "CUDA GPU"
                vram_total_gb = 0.0
            precision_label = "FP16 (AMP)" if USE_FP16_INFERENCE else "FP32"
            device_label = f"CUDA ({gpu_name})"
        else:
            device_idx = None
            gpu_name = "N/A"
            vram_total_gb = 0.0
            precision_label = "FP32"
            device_label = "CPU"

        total_chunks = math.ceil(total_n / mini_batch_size)
        logger.info(
            f"[AI BATCH] Starting inference for {total_n} reviews | Device: {device_label} | Mode: {precision_label} | Mini-batch: {mini_batch_size}"
        )

        # -----------------------------
        # Mini-Batch Forward Passes with OOM Recovery
        # -----------------------------
        i = 0
        chunk_counter = 0

        while i < total_n:
            chunk_items = indexed_reviews[i : i + mini_batch_size]
            chunk_texts = [text for _, text in chunk_items]
            chunk_counter += 1
            step_start = time.perf_counter()

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

                max_tokens = input_ids.shape[1]

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
                step_ms = int((time.perf_counter() - step_start) * 1000)

                if is_cuda:
                    vram_used_gb = torch.cuda.memory_allocated(device_idx) / (1024 ** 3)
                    logger.info(
                        f"[AI BATCH] Chunk [{chunk_counter:2d}/{total_chunks}] ({len(chunk_items):2d} reviews) | Max tokens: {max_tokens:3d} | VRAM: {vram_used_gb:.2f} GB / {vram_total_gb:.1f} GB | Step: {step_ms}ms"
                    )
                else:
                    logger.info(
                        f"[AI BATCH] Chunk [{chunk_counter:2d}/{total_chunks}] ({len(chunk_items):2d} reviews) | Max tokens: {max_tokens:3d} | Step: {step_ms}ms"
                    )

                i += len(chunk_items)

            except (torch.cuda.OutOfMemoryError, RuntimeError) as oom_err:
                if is_cuda and "out of memory" in str(oom_err).lower() and mini_batch_size > 1:
                    torch.cuda.empty_cache()
                    mini_batch_size = max(1, mini_batch_size // 2)
                    total_chunks = math.ceil((total_n - i) / mini_batch_size) + (chunk_counter - 1)
                    logger.warning(
                        f"[AI BATCH] [WARN] CUDA OOM encountered. Halving mini-batch size to {mini_batch_size} and retrying..."
                    )
                else:
                    raise oom_err

        # -----------------------------
        # Reconstruct Outputs in Original Order
        # -----------------------------
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

        elapsed_s = time.perf_counter() - start_time
        speed = total_n / elapsed_s if elapsed_s > 0 else 0.0

        if is_cuda:
            try:
                peak_vram_gb = torch.cuda.max_memory_allocated(device_idx) / (1024 ** 3)
            except Exception:
                peak_vram_gb = 0.0
            logger.info(
                f"[AI BATCH] [DONE] Completed {total_n} reviews in {elapsed_s:.2f}s ({speed:.1f} revs/sec) | Peak VRAM: {peak_vram_gb:.2f} GB"
            )
        else:
            logger.info(
                f"[AI BATCH] [DONE] Completed {total_n} reviews in {elapsed_s:.2f}s ({speed:.1f} revs/sec)"
            )

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