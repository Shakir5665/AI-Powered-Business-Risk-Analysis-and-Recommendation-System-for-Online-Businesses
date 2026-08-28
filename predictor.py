#!/usr/bin/env python3
"""
RiskAI Predictor v2.0 - Standalone Production AI Inference Tool
================================================================
Zero-configuration, GPU-accelerated batch predictor for e-commerce reviews.
Transforms raw customer feedback in Excel files into actionable risk insights
using multi-task XLM-RoBERTa + Bottleneck Adapters + Fuzzy Logic BRI.

Supported Platforms:
- Local Workstations / Servers (CUDA GPU or CPU fallback)
- Google Colab (Free T4 GPU with auto Google Drive integration)

Usage:
    python predictor.py [path_to_excel_file.xlsx]
"""

import os
import sys
import io
import time
import math
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import torch
import pandas as pd
import numpy as np

# ------------------------------------------------------------------------------
# Core AI Pipeline Imports (Sentiment & Aspect Multi-Task Model)
# ------------------------------------------------------------------------------
try:
    from core.ai.inference.model_loader import ModelLoader
    from core.ai.inference.inference_engine import InferenceEngine
    from core.ai.inference.prediction_formatter import PredictionFormatter
except ImportError as err:
    print(f"\n❌ Error: Failed to import internal modules: {err}")
    print("Please ensure you are running predictor.py from the repository root directory.")
    sys.exit(1)


# ==============================================================================
# Helper Functions: Google Colab & Environment Detection
# ==============================================================================

def is_google_colab() -> bool:
    """Check if the script is running inside a Google Colab environment."""
    return "google.colab" in sys.modules or os.path.exists("/content")


def setup_google_drive() -> Optional[Path]:
    """
    Mounts Google Drive automatically when running in Google Colab.
    Returns the target output directory in Google Drive or a local fallback.
    """
    if is_google_colab():
        # Check if already mounted
        drive_path = Path("/content/drive/MyDrive")
        if drive_path.exists():
            reports_dir = drive_path / "AI_Reports"
            reports_dir.mkdir(parents=True, exist_ok=True)
            print(f"📁 Google Drive destination: {reports_dir}")
            return reports_dir

        try:
            from google.colab import drive
            import IPython
            if IPython.get_ipython() is not None:
                print("\n🔄 Mounting Google Drive...")
                drive.mount("/content/drive", force_remount=False)
                if drive_path.exists():
                    reports_dir = drive_path / "AI_Reports"
                    reports_dir.mkdir(parents=True, exist_ok=True)
                    print(f"✅ Google Drive mounted successfully. Reports destination: {reports_dir}")
                    return reports_dir
        except Exception:
            pass  # Subprocess or headless execution

        # Fallback directory in Colab
        local_fallback = Path("/content/AI_Reports")
        local_fallback.mkdir(parents=True, exist_ok=True)
        return local_fallback
    else:
        local_reports = PROJECT_ROOT / "outputs" / "reports"
        local_reports.mkdir(parents=True, exist_ok=True)
        return local_reports


def detect_optimal_device_and_batch_size() -> Tuple[torch.device, str, int]:
    """
    Detects available hardware (CUDA GPU vs CPU) and calculates optimal batch size.
    """
    if torch.cuda.is_available():
        device = torch.device("cuda")
        gpu_name = torch.cuda.get_device_name(0)
        total_vram_gb = torch.cuda.get_device_properties(0).total_memory / (1024 ** 3)
        
        # Calculate dynamic batch size based on available VRAM
        if total_vram_gb >= 15:      # e.g., Tesla T4 (16GB), V100, A100
            initial_batch_size = 64
        elif total_vram_gb >= 8:     # e.g., RTX 3070/3080/4070 (8-12GB)
            initial_batch_size = 32
        else:                        # Lower memory GPUs
            initial_batch_size = 16
            
        device_label = f"GPU: {gpu_name} ({total_vram_gb:.1f} GB)"
    else:
        device = torch.device("cpu")
        initial_batch_size = 8
        device_label = "CPU (GPU not available)"

    return device, device_label, initial_batch_size


# ==============================================================================
# Progress Bar and Terminal Formatting
# ==============================================================================

def print_progress_bar(iteration: int, total: int, prefix: str = '', suffix: str = '', decimals: int = 1, length: int = 30, fill: str = '█'):
    """
    Call in a loop to create terminal progress bar
    """
    percent = ("{0:." + str(decimals) + "f}").format(100 * (iteration / float(total)))
    filled_length = int(length * iteration // total)
    bar = fill * filled_length + ' ' * (length - filled_length)
    sys.stdout.write(f'\r{prefix} [{bar}] {percent}% | {suffix}')
    sys.stdout.flush()
    if iteration >= total:
        sys.stdout.write('\n')
        sys.stdout.flush()


def format_time_delta(seconds: float) -> str:
    """Format seconds into HH:MM:SS string."""
    seconds = max(0, int(seconds))
    mins, secs = divmod(seconds, 60)
    hours, mins = divmod(mins, 60)
    if hours > 0:
        return f"{hours:02d}:{mins:02d}:{secs:02d}"
    return f"{mins:02d}:{secs:02d}"


# ==============================================================================
# Data Loader and Excel Processor
# ==============================================================================

def load_and_prepare_excel(file_path: Path) -> Tuple[pd.DataFrame, str]:
    """
    Loads Excel or CSV file, validates and standardizes the required columns:
    ['text', 'sentiment', 'aspects']
    """
    if not file_path.exists():
        raise FileNotFoundError(f"❌ Error: File not found at '{file_path}'. Please check the path.")

    # Attempt to read with multiple engines
    df = None
    engines_to_try = ["openpyxl", "calamine", "xlrd"]
    
    if file_path.suffix.lower() in [".xlsx", ".xls", ".xlsm"]:
        for engine in engines_to_try:
            try:
                df = pd.read_excel(file_path, engine=engine)
                break
            except Exception:
                continue
        if df is None:
            # Last resort fallback
            try:
                df = pd.read_excel(file_path)
            except Exception as e:
                raise ValueError(f"❌ Error: Failed to parse Excel file '{file_path}'. Reason: {e}")
    elif file_path.suffix.lower() == ".csv":
        try:
            df = pd.read_csv(file_path, encoding="utf-8")
        except UnicodeDecodeError:
            df = pd.read_csv(file_path, encoding="latin1")
    else:
        raise ValueError(f"❌ Error: Unsupported file format '{file_path.suffix}'. Please provide a .xlsx or .csv file.")

    if df is None or len(df) == 0:
        raise ValueError(f"❌ Error: The file '{file_path.name}' is empty.")

    # Locate 'text' column (flexible case-insensitive search)
    text_col = None
    candidates = ["text", "review", "reviews", "review_text", "comment", "feedback", "content", "customer_review"]
    for col in df.columns:
        if str(col).strip().lower() in candidates:
            text_col = col
            break

    if not text_col:
        # If no standard name found, pick the first string-heavy column
        first_col = df.columns[0]
        print(f"⚠️ Warning: Standard 'text' column not found. Using '{first_col}' as input text.")
        text_col = first_col

    # Standardize column naming
    if text_col != "text":
        df.rename(columns={text_col: "text"}, inplace=True)

    # Ensure 'sentiment' and 'aspects' columns exist
    if "sentiment" not in df.columns:
        df["sentiment"] = ""
    if "aspects" not in df.columns:
        df["aspects"] = ""

    # Clean missing / null values in text column
    df["text"] = df["text"].fillna("").astype(str)

    return df, "text"


# ==============================================================================
# Predictor Engine Class
# ==============================================================================

class BatchPredictorRunner:
    """
    Production-ready batch prediction coordinator with dynamic OOM recovery.
    """

    def __init__(self, batch_size: int = 64):
        self.device, self.device_label, self.batch_size = detect_optimal_device_and_batch_size()
        if batch_size:
            self.batch_size = batch_size

        print("📊 Loading model and tokenizer...", end="", flush=True)
        try:
            self.loader = ModelLoader()
            # Ensure model is on the correct target device
            self.loader.device = self.device
            self.loader.model.to(self.device)
            self.loader.model.eval()
            
            self.inference_engine = InferenceEngine(self.loader)
            self.formatter = PredictionFormatter(self.loader)
            print(f" ✅ ({self.device_label})")
        except Exception as e:
            print(f"\n❌ Error loading AI model: {e}")
            raise

    def predict_batch_with_retry(self, texts: List[str], current_batch_size: int) -> Tuple[List[Dict[str, Any]], int]:
        """
        Executes prediction on a batch of review strings.
        Catches GPU Out Of Memory (OOM) errors, halves batch size, and retries.
        """
        results = []
        i = 0
        b_size = current_batch_size

        while i < len(texts):
            chunk = texts[i : i + b_size]
            try:
                outputs = self.inference_engine.predict_batch(chunk)
                for idx, text in enumerate(chunk):
                    single_out = self.inference_engine.get_single_output(outputs, idx)
                    formatted = self.formatter.format(text, single_out)
                    results.append(formatted)
                i += len(chunk)
            except (torch.cuda.OutOfMemoryError, RuntimeError) as oom_err:
                if "out of memory" in str(oom_err).lower() and b_size > 1:
                    if torch.cuda.is_available():
                        torch.cuda.empty_cache()
                    b_size = max(1, b_size // 2)
                    print(f"\n⚠️ GPU Out of Memory: dynamically reducing batch size to {b_size} and retrying...")
                else:
                    # Reraise non-OOM errors
                    raise oom_err

        return results, b_size

    def run_prediction_pipeline(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, List[Dict[str, Any]], Dict[str, Any]]:
        """
        Runs batch prediction over entire DataFrame for Sentiment and Aspect detection.
        """
        total_reviews = len(df)
        all_texts = df["text"].tolist()
        
        print(f"🔄 Batch processing: {self.batch_size} reviews/batch")
        total_batches = math.ceil(total_reviews / self.batch_size)

        predictions: List[Dict[str, Any]] = []
        start_time = time.time()
        current_b_size = self.batch_size

        for b_idx in range(total_batches):
            start_i = b_idx * self.batch_size
            end_i = min(start_i + self.batch_size, total_reviews)
            batch_texts = all_texts[start_i:end_i]

            batch_results, current_b_size = self.predict_batch_with_retry(batch_texts, current_b_size)
            predictions.extend(batch_results)

            # Calculate ETA
            elapsed = time.time() - start_time
            reviews_processed = len(predictions)
            rate = reviews_processed / elapsed if elapsed > 0 else 1.0
            remaining_reviews = total_reviews - reviews_processed
            eta_secs = remaining_reviews / rate if rate > 0 else 0

            suffix = f"{b_idx + 1}/{total_batches} batches | ETA: {format_time_delta(eta_secs)}"
            print_progress_bar(reviews_processed, total_reviews, prefix="Progress:", suffix=suffix)

        # ----------------------------------------------------------------------
        # Update DataFrame with Formatted Output
        # ----------------------------------------------------------------------
        sentiment_col = []
        aspects_col = []

        pos_count = 0
        neg_count = 0
        neu_count = 0

        aspect_counts = {
            "quality": 0,
            "delivery": 0,
            "trust": 0
        }

        for pred in predictions:
            # Sentiment: Title Case (Positive, Negative, Neutral)
            raw_sentiment = str(pred.get("sentiment", "neutral")).strip().capitalize()
            sentiment_col.append(raw_sentiment)

            if raw_sentiment == "positive":
                pos_count += 1
            elif raw_sentiment == "negative":
                neg_count += 1
            else:
                neu_count += 1

            # Aspects: Comma-separated list from [Quality, Delivery, Trust]
            detected = pred.get("detected_aspects", [])
            formatted_aspects = []
            for a in detected:
                if a:
                    aspect_title = str(a).strip().capitalize()
                    formatted_aspects.append(aspect_title)
                    if aspect_title in aspect_counts:
                        aspect_counts[aspect_title] += 1
                    else:
                        aspect_counts[aspect_title] = 1

            aspects_str = ", ".join(formatted_aspects)
            aspects_col.append(aspects_str)

        df["sentiment"] = sentiment_col
        df["aspects"] = aspects_col

        summary_metrics = {
            "total_reviews": total_reviews,
            "positive_count": pos_count,
            "negative_count": neg_count,
            "neutral_count": neu_count,
            "positive_ratio": (pos_count / total_reviews * 100) if total_reviews > 0 else 0.0,
            "negative_ratio": (neg_count / total_reviews * 100) if total_reviews > 0 else 0.0,
            "neutral_ratio": (neu_count / total_reviews * 100) if total_reviews > 0 else 0.0,
            "aspect_counts": aspect_counts,
        }

        return df, predictions, summary_metrics


# ==============================================================================
# Summary Display & Output Generation
# ==============================================================================

def display_summary(metrics: Dict[str, Any], output_path: Path):
    """
    Renders executive console summary for Sentiment & Aspect predictions.
    """
    total = metrics["total_reviews"]
    pos = metrics["positive_count"]
    neg = metrics["negative_count"]
    neu = metrics["neutral_count"]
    pos_pct = metrics["positive_ratio"]
    neg_pct = metrics["negative_ratio"]
    neu_pct = metrics["neutral_ratio"]
    aspect_counts = metrics.get("aspect_counts", {})

    print(f"\n💾 Results saved to: {output_path}")
    print("📈 Summary:")
    print(f"   - Positive: {pos:,} ({pos_pct:.1f}%)")
    print(f"   - Negative: {neg:,} ({neg_pct:.1f}%)")
    print(f"   - Neutral:  {neu:,} ({neu_pct:.1f}%)")
    print("   - Aspect Mentions:")
    for aspect_name, count in aspect_counts.items():
        pct = (count / total * 100) if total > 0 else 0.0
        print(f"      • {aspect_name}: {count:,} ({pct:.1f}%)")
    print("\n✅ Analysis complete! View results in Google Drive or outputs folder.")


# ==============================================================================
# Interactive File Selection & Colab Upload
# ==============================================================================

def resolve_input_file(arg_path: Optional[str] = None) -> Path:
    """
    Resolves input file path from:
    1. CLI argument (if provided and valid)
    2. Google Colab interactive file upload widget (when in Colab notebook)
    3. Auto-detected Excel/CSV files in /content/ or current directory
    4. Interactive prompt
    """
    if arg_path:
        p = Path(arg_path)
        if p.exists():
            return p
        print(f"⚠️ Warning: Specified file '{arg_path}' not found.")

    # 1. Google Colab: Try native file upload widget (works when executed inside notebook)
    if is_google_colab():
        try:
            import IPython
            if IPython.get_ipython() is not None:
                print("\n📤 Google Colab: Please upload your Excel (.xlsx) file...")
                from google.colab import files
                uploaded = files.upload()
                if uploaded:
                    uploaded_filename = list(uploaded.keys())[0]
                    uploaded_path = Path(uploaded_filename)
                    print(f"✅ Upload complete: '{uploaded_path.name}' received successfully.")
                    return uploaded_path
        except Exception:
            pass  # Fallback to file scan if running as subshell (!python)

        # In Colab subshell: Check /content/ directory for user uploaded files
        content_files = [
            f for f in list(Path("/content").glob("*.xlsx")) + list(Path("/content").glob("*.csv"))
            if not f.name.startswith("~$") and "dataset" not in f.name.lower()
        ]
        if content_files:
            # Sort by latest modification time
            latest_file = max(content_files, key=os.path.getmtime)
            print(f"📁 Auto-detected uploaded file in /content/: '{latest_file.name}'")
            return latest_file

    # 2. Local / Standard Scan: Check current working directory for .xlsx files
    xlsx_files = list(Path(".").glob("*.xlsx"))
    csv_files = list(Path(".").glob("*.csv"))
    all_files = [f for f in xlsx_files + csv_files if not f.name.startswith("~$") and "dataset" not in f.name.lower()]

    if all_files:
        latest_local = max(all_files, key=os.path.getmtime)
        print(f"📁 Auto-detected file: {latest_local.name}")
        try:
            user_input = input(f"Press Enter to process '{latest_local.name}' or enter file path: ").strip()
            if user_input:
                p = Path(user_input)
                if p.exists():
                    return p
                else:
                    raise FileNotFoundError(f"❌ Error: File not found at '{user_input}'.")
            return latest_local
        except (EOFError, io.UnsupportedOperation):
            return latest_local

    # 3. Prompt user directly
    try:
        user_input = input("📁 Enter the path to your Excel (.xlsx) file: ").strip()
        if user_input:
            p = Path(user_input)
            if p.exists():
                return p
    except (EOFError, Exception):
        pass

    raise ValueError(
        "❌ Error: No Excel file found.\n"
        "💡 In Google Colab, you can either:\n"
        "   1. Drag & drop your .xlsx file into the left 'Files' folder in Colab, then re-run.\n"
        "   2. Pass the file path: !python predictor.py your_file.xlsx\n"
        "   3. Run directly in a notebook cell:\n"
        "      import predictor\n"
        "      predictor.run()\n"
    )


# ==============================================================================
# Main & Python Cell Runner
# ==============================================================================

def run(file_path: Optional[str] = None):
    """
    Direct Python execution function for Google Colab and Jupyter Notebook cells.
    Usage in Colab:
        import predictor
        predictor.run()
    """
    main(file_path)


def main(file_arg: Optional[str] = None):
    print("\n" + "=" * 60)
    print("🚀 RiskAI Predictor v2.0 Initialized")
    print("=" * 60)

    # 1. Google Drive / Target Directory Setup
    reports_dir = setup_google_drive()

    # 2. Resolve Input File
    cli_arg = file_arg or (sys.argv[1] if len(sys.argv) > 1 else None)
    try:
        input_file = resolve_input_file(cli_arg)
    except Exception as e:
        print(f"\n{e}")
        sys.exit(1)

    # 3. Load and Validate Excel
    try:
        df, _ = load_and_prepare_excel(input_file)
    except Exception as e:
        print(f"\n{e}")
        sys.exit(1)

    review_count = len(df)
    print(f"📁 Processing: {input_file.name} ({review_count:,} reviews)")

    # 4. Initialize Predictor Runner
    try:
        runner = BatchPredictorRunner()
    except Exception as e:
        print(f"❌ Fatal Error: Could not initialize AI engine: {e}")
        sys.exit(1)

    # 5. Run Batch Predictions
    try:
        updated_df, predictions, metrics = runner.run_prediction_pipeline(df)
    except Exception as e:
        print(f"\n❌ Error during prediction pipeline: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

    # 6. Save Updated Excel File
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    stem = input_file.stem
    output_filename = f"{stem}_{timestamp}.xlsx"
    output_path = reports_dir / output_filename

    try:
        updated_df.to_excel(output_path, index=False, engine="openpyxl")
    except Exception as save_err:
        # Fallback to current working directory
        fallback_path = Path(".") / output_filename
        print(f"⚠️ Warning: Could not save to {output_path} ({save_err}). Saving to local directory: {fallback_path}")
        updated_df.to_excel(fallback_path, index=False, engine="openpyxl")
        output_path = fallback_path

    # 7. Print Final Visual Summary
    display_summary(metrics, output_path)

    # 8. If on Colab, offer automatic direct download
    if is_google_colab():
        try:
            import IPython
            if IPython.get_ipython() is not None:
                from google.colab import files
                print("📥 Initiating automatic browser download for your updated Excel report...")
                files.download(str(output_path))
        except Exception:
            pass


if __name__ == "__main__":
    main()


