# 🚀 AI Business Risk Analysis System: Complete Operational Guide

> **Production Deployment & Runbook**  
> Direct reference guide matching the [`Backend_Riskora.ipynb`](file:///c:/Users/shaki/Desktop/Backend-AI-Business-Risk-Analysis-System/Backend_Riskora.ipynb) Google Colab notebook for **Mode A** (Colab T4 GPU Acceleration) and local offline execution for **Mode B** (100% Local PC).

---

## 📌 Architecture & Data Flow

```mermaid
flowchart TD
    subgraph Mode_A["Mode A: Hybrid GPU Acceleration (Live Demo & Presentation)"]
        A1["🌐 Local PC: React Frontend (localhost:5173)"] <--> A2["⚙️ Local PC: FastAPI Backend (localhost:8000)"]
        A2 -->|Selenium + Chrome UI| A3["🛒 Daraz.lk (Sri Lankan Residential IP)"]
        A3 -->|125+ Scraped Reviews| A2
        A2 -->|HTTP POST /predict-batch (~0.2s)| A4["⚡ Google Colab (Tesla T4 GPU 15GB VRAM)"]
        A4 -->|XLM-RoBERTa + Adapters (~2s)| A2
        A2 -->|Fuzzy Logic & Risk Engine| A5[("☁️ Neon Cloud PostgreSQL")]
    end

    subgraph Mode_B["Mode B: 100% Pure Local Execution (Offline / Dev)"]
        B1["🌐 Local PC: React Frontend (localhost:5173)"] <--> B2["⚙️ Local PC: FastAPI Backend (localhost:8000)"]
        B2 -->|Selenium + Chrome UI| B3["🛒 Daraz.lk (Sri Lankan Residential IP)"]
        B3 -->|Scraped Reviews| B2
        B2 -->|Local CPU Inference (~35-50s)| B4["💻 Local PC CPU (XLM-RoBERTa Model)"]
        B4 -->|Fuzzy Logic & Risk Engine| B5[("☁️ Neon Cloud PostgreSQL")]
    end
```

---

## ⚖️ Mode Comparison Matrix

| Feature | ⚡ Mode A: Colab GPU Offload | 💻 Mode B: 100% Local PC |
| :--- | :--- | :--- |
| **Primary Use-Case** | **Final Presentation / Evaluator Demo** | **Daily Coding & Offline Testing** |
| **Scraper Execution** | Local PC (Visible Chrome Browser) | Local PC (Visible Chrome Browser) |
| **IP Detection / Daraz Shield** | ✅ **Bypassed** (Uses Local Sri Lankan ISP) | ✅ **Bypassed** (Uses Local Sri Lankan ISP) |
| **AI Prediction Speed (125 reviews)** | 🚀 **~2 to 3 seconds** | ⏱️ **~35 to 50 seconds** |
| **Hardware Strain** | 0% CPU strain on PC (Runs in Cloud) | 80–100% CPU strain for ~1 minute |
| **Colab Session Needed?** | Yes (Kept open during presentation) | No (Completely self-contained) |
| **Database** | Neon Cloud PostgreSQL | Neon Cloud PostgreSQL |

---

## ⚡ Mode A: Colab GPU Setup (Matching `Backend_Riskora.ipynb`)

> [!TIP]
> **Why this mode wins on presentation day:**
> 1. Evaluators see Chrome physically open on your screen and scrape reviews live without triggering bot blocks.
> 2. Predictions that normally lag on CPU finish in **2 seconds** flat on Google's Tesla T4 GPU.

### Phase 1: Run Notebook Cells in Colab (`Backend_Riskora.ipynb`)

Open your [`Backend_Riskora.ipynb`](file:///c:/Users/shaki/Desktop/Backend-AI-Business-Risk-Analysis-System/Backend_Riskora.ipynb) notebook in Google Colab (Ensure **T4 GPU** is selected under **Runtime ➔ Change runtime type**).

#### 🔹 Cell 1: Clean Working Directory & Clone Branch
```bash
# 1. Step back to root directory first (prevents getcwd error)
%cd /content

# 2. Clean up previous folder
!rm -rf /content/app

# 3. Clone fresh repository
!git clone https://github.com/Shakir5665/Backend-AI-Business-Risk-Analysis-System.git /content/app

# 4. Enter the cloned repository
%cd /content/app

# 5. Switch to UI/UX-features branch
!git checkout UI/UX-features

# 6. Verify branch
!git branch
```

#### 🔹 Cell 2: Configure Environment Variables
```python
%%writefile .env
DATABASE_URL=postgresql+psycopg2://neondb_owner:npg_OMhKf9BF5cEC@ep-super-river-azkj7y09-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
SMTP_USER=shakirsar225974@gmail.com
SMTP_PASSWORD=mqcymuedkukfvnul
MODEL_VERSION=v3
DEBUG=False
```

#### 🔹 Cell 3: Mount Google Drive & Symlink Model Checkpoint
```python
from google.colab import drive
import os

# 1. Mount Google Drive
drive.mount('/content/drive')

# 2. Ensure the destination directory exists
!mkdir -p /content/app/models/v3

# 3. Create a Symlink (instant, takes 0 seconds and uses 0 Colab disk space!)
drive_model_path = "/content/drive/MyDrive/AI-Business-Risk-Analysis-System/checkpoints/best_model.pt"
dest_model_path = "/content/app/models/v3/best_model.pt"

if os.path.exists(dest_model_path):
    os.remove(dest_model_path)

!ln -s "{drive_model_path}" "{dest_model_path}"

# 4. Verify the model file is accessible
!ls -lh /content/app/models/v3/
```

#### 🔹 Cell 4: Install Dependencies & Cloudflare
```bash
!pip install -r requirements.txt
!pip install pycloudflared
```

> [!NOTE]
> In [`Backend_Riskora.ipynb`](file:///c:/Users/shaki/Desktop/Backend-AI-Business-Risk-Analysis-System/Backend_Riskora.ipynb), Cells 5, 6, and 7 contain platform patches for `msvcrt`, `headless Chrome`, and the `/predict-batch` endpoint. Because the `ColabBackend` branch already has these committed, they run safely as idempotent verifications.

#### 🔹 Cell 5: Launch Tunnel & Start Backend
```python
import subprocess
import time
import re

# 1. Kill any old stuck processes
!pkill -9 -f cloudflared
!pkill -9 -f uvicorn

# 2. Install official cloudflared binary directly (takes 2 seconds)
!wget -q -nc https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
!dpkg -i cloudflared-linux-amd64.deb > /dev/null 2>&1

# 3. Start Cloudflare Tunnel and capture the BRAND NEW live URL
print("🌐 Creating a fresh Cloudflare Tunnel...")
tunnel_proc = subprocess.Popen(
    ["cloudflared", "tunnel", "--url", "http://127.0.0.1:8000"],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

fresh_url = None
# Scan logs for the real new URL
for line in tunnel_proc.stderr:
    match = re.search(r"https://[a-zA-Z0-9-]+\.trycloudflare\.com", line)
    if match:
        fresh_url = match.group(0)
        break

print("\n" + "=" * 65)
print(f"🚀 YOUR FRESH PUBLIC URL: {fresh_url}")
print(f"👉 COPY THIS TO LOCAL .env: REMOTE_GPU_URL={fresh_url}")
print("=" * 65 + "\n")

# 4. Now launch FastAPI backend!
!python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

---

### Phase 2: Configure Your Local PC

#### 1. Configure Backend Environment (`.env`)
Open [`.env`](file:///c:/Users/shaki/Desktop/Backend-AI-Business-Risk-Analysis-System/.env) in your local project root and paste the Colab Cloudflare URL:
```env
DATABASE_URL=postgresql://neondb_owner:npg_OMhKf9BF5cEC@ep-super-river-azkj7y09-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
SMTP_USER=shakirsar225974@gmail.com
SMTP_PASSWORD=mqcymuedkukfvnul
MODEL_VERSION=v3

# Paste the URL generated by Colab Cell 5:
REMOTE_GPU_URL=https://<your-colab-url>.trycloudflare.com
```

#### 2. Configure Frontend Environment (`frontend/.env`)
Open [`frontend/.env`](file:///c:/Users/shaki/Desktop/Backend-AI-Business-Risk-Analysis-System/frontend/.env) and verify it points to your local backend:
```env
VITE_API_URL=http://localhost:8000/api
```

---

### Phase 3: Launch Local Stack

Open two terminal windows on your local PC:

#### Terminal 1: Local Backend
```powershell
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

#### Terminal 2: Local Frontend
```powershell
cd frontend
npm run dev
```

Open **`http://localhost:5173`** and click **Analyze Product**:
- Chrome physically opens on your PC screen, scrolls Daraz, and collects reviews without bot blocks.
- The terminal logs: `[GPU OFFLOAD] Offloading 125 reviews to remote Colab GPU...`
- In **2 seconds**, predictions return from Colab T4 GPU and the full dashboard renders!

---

<br>

---

## 💻 Mode B: 100% Pure Local PC Mode (Offline & Daily Dev)

> [!NOTE]
> Use this mode when developing new frontend/backend features or when you do not want to open Google Colab.

### Step 1: Disable Remote GPU URL in Local `.env`
Open [`.env`](file:///c:/Users/shaki/Desktop/Backend-AI-Business-Risk-Analysis-System/.env) and comment out or remove `REMOTE_GPU_URL`:
```env
DATABASE_URL=postgresql://neondb_owner:npg_OMhKf9BF5cEC@ep-super-river-azkj7y09-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
SMTP_USER=shakirsar225974@gmail.com
SMTP_PASSWORD=mqcymuedkukfvnul
MODEL_VERSION=v3

# Leave commented for pure local CPU prediction:
# REMOTE_GPU_URL=
```

### Step 2: Ensure Frontend Environment is Local
In [`frontend/.env`](file:///c:/Users/shaki/Desktop/Backend-AI-Business-Risk-Analysis-System/frontend/.env):
```env
VITE_API_URL=http://localhost:8000/api
```

### Step 3: Start Both Terminals
1. **Terminal 1 (Backend):**
   ```powershell
   .\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
   ```
2. **Terminal 2 (Frontend):**
   ```powershell
   cd frontend
   npm run dev
   ```
3. Open **`http://localhost:5173`**.

The pipeline will scrape via local Chrome and predict via your local CPU (taking ~35–50 seconds for 100+ reviews) before rendering the final business risk index.

---

## 🛠️ Common Pitfalls & Solutions

> [!IMPORTANT]
> **Issue: Cloudflare Error 1016 (Origin DNS Error)**  
> **Cause:** The Cloudflare tunnel was closed or restarted, changing the public domain.  
> **Fix:** Check the active URL printed in Colab Cell 5, update `REMOTE_GPU_URL` in your local `.env`, and restart the local backend.

> [!WARNING]
> **Issue: Daraz "Unusual traffic detected" Modal Popup**  
> **Cause:** Occurs when running Selenium directly inside Colab (US datacenter IP).  
> **Fix:** Run the backend locally on your PC as documented in Mode A. Your residential Sri Lankan IP bypasses Daraz bot security completely while still using Colab for GPU inference.

> [!TIP]
> **Issue: Windows `UnicodeEncodeError: 'charmap'`**  
> **Cause:** Legacy Windows console cannot print non-ASCII emoji characters (e.g. `⚡`).  
> **Fix:** Already resolved in [`core/ai/pipeline/review_prediction_pipeline.py`](file:///c:/Users/shaki/Desktop/Backend-AI-Business-Risk-Analysis-System/core/ai/pipeline/review_prediction_pipeline.py) using clean ASCII log prefixes (`[GPU OFFLOAD]`).
