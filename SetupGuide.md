# 🚀 AI Business Risk Analysis System: Execution & Deployment Guide

> **Production Deployment & Demo Runbook**  
> Choose between **Mode A** (Colab T4 GPU Acceleration for ultra-fast presentations) or **Mode B** (100% Local PC Execution for offline development).

---

## 📌 Executive Architecture Overview

```mermaid
flowchart TD
    subgraph Mode_A["Mode A: Hybrid GPU Acceleration (Recommended for Demos)"]
        A1["🌐 Local PC: React Frontend (localhost:5173)"] <--> A2["⚙️ Local PC: FastAPI Backend (localhost:8000)"]
        A2 -->|Selenium + Chrome UI| A3["🛒 Daraz.lk (Sri Lankan Residential IP)"]
        A3 -->|Scraped Reviews| A2
        A2 -->|HTTP Batch POST (~0.2s)| A4["⚡ Google Colab (Tesla T4 GPU 15GB VRAM)"]
        A4 -->|XLM-RoBERTa + Adapters (~2s)| A2
        A2 -->|Fuzzy Logic & Risk Engine| A5[("☁️ Neon Cloud PostgreSQL")]
    end

    subgraph Mode_B["Mode B: 100% Pure Local Execution"]
        B1["🌐 Local PC: React Frontend (localhost:5173)"] <--> B2["⚙️ Local PC: FastAPI Backend (localhost:8000)"]
        B2 -->|Selenium + Chrome UI| B3["🛒 Daraz.lk (Sri Lankan Residential IP)"]
        B3 -->|Scraped Reviews| B2
        B2 -->|Local CPU Inference (~35-50s)| B4["💻 PC CPU (XLM-RoBERTa Model)"]
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

## ⚡ Mode A: Hybrid Colab GPU Setup (Demo & Viva)

> [!TIP]
> **Why this mode wins on presentation day:**
> 1. Evaluators see Chrome physically open on your screen and scrape reviews live.
> 2. Predictions that normally lag on CPU finish in **2 seconds** flat on Google's Tesla T4 GPU.

### Phase 1: Prepare Google Colab

1. Open [Google Colab](https://colab.research.google.com/).
2. Navigate to: **Runtime** ➔ **Change runtime type** ➔ Select **T4 GPU** ➔ Click **Save**.

#### Run Notebook Cells Sequentially:

##### 🔹 Cell 1: Clone Repository & Switch Branch
```bash
%cd /content
!rm -rf /content/app
!git clone https://github.com/Shakir5665/Backend-AI-Business-Risk-Analysis-System.git /content/app
%cd /content/app
!git checkout UI/UX-features
!nvidia-smi
```

##### 🔹 Cell 2: Configure Environment Variables
```python
%%writefile .env
DATABASE_URL=postgresql+psycopg2://neondb_owner:npg_OMhKf9BF5cEC@ep-super-river-azkj7y09-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
SMTP_USER=shakirsar225974@gmail.com
SMTP_PASSWORD=mqcymuedkukfvnul
MODEL_VERSION=v3
DEBUG=False
```

##### 🔹 Cell 3: Mount Google Drive & Link Model Checkpoint
```python
from google.colab import drive
import os

drive.mount('/content/drive')
!mkdir -p /content/app/models/v3

# Link model checkpoint from Google Drive (Zero disk duplicate, instant mount)
drive_model_path = "/content/drive/MyDrive/AI-Business-Risk-Analysis-System/checkpoints/best_model.pt"
dest_model_path = "/content/app/models/v3/best_model.pt"

if os.path.exists(dest_model_path):
    os.remove(dest_model_path)

!ln -s "{drive_model_path}" "{dest_model_path}"
!ls -lh /content/app/models/v3/
```

##### 🔹 Cell 4: Install Dependencies & Cloudflare Tunnel
```bash
!pip install -r requirements.txt
!pip install "psycopg[binary]" psycopg2-binary
!wget -q -nc https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
!dpkg -i cloudflared-linux-amd64.deb > /dev/null 2>&1
```

##### 🔹 Cell 5: Launch Colab GPU Backend & Tunnel
```python
import subprocess, re

!pkill -9 -f cloudflared
!pkill -9 -f uvicorn

# Start public tunnel in background
tunnel_proc = subprocess.Popen(
    ["cloudflared", "tunnel", "--url", "http://127.0.0.1:8000"],
    stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
)

for line in tunnel_proc.stderr:
    match = re.search(r"https://[a-zA-Z0-9-]+\.trycloudflare\.com", line)
    if match:
        print("\n" + "=" * 65)
        print(f"🚀 COLAB GPU SERVER READY AT: {match.group(0)}")
        print(f"👉 COPY THIS URL TO YOUR LOCAL .env")
        print("=" * 65 + "\n")
        break

# Start FastAPI server on GPU
!python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

---

### Phase 2: Configure Your Local PC

#### 1. Configure Backend Environment (`.env`)
Open `.env` in your project root and paste the Colab Cloudflare URL:
```env
DATABASE_URL=postgresql://neondb_owner:npg_OMhKf9BF5cEC@ep-super-river-azkj7y09-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
SMTP_USER=shakirsar225974@gmail.com
SMTP_PASSWORD=mqcymuedkukfvnul
MODEL_VERSION=v3

# GPU Offloading Endpoint (From Colab Cell 5)
REMOTE_GPU_URL=https://<your-colab-url>.trycloudflare.com
```

#### 2. Configure Frontend Environment (`frontend/.env`)
Open `frontend/.env` and verify it connects to your local backend:
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

> [!NOTE]
> Open `http://localhost:5173` in your browser. Trigger an analysis on any Daraz link:
> - A Chrome window pops up locally, scrolls, and scrapes reviews.
> - The terminal logs: `[GPU OFFLOAD] Offloading X reviews to remote Colab GPU...`
> - Within **2 seconds**, predictions return from Colab and your analysis dashboard completes!

---

<br>

---

## 💻 Mode B: 100% Local PC Setup (Offline & Daily Dev)

> [!NOTE]
> Use this mode when developing new frontend/backend features or when you don't want to open Google Colab.

### Step 1: Disable Remote GPU URL in Local `.env`
Open `.env` in the repository root and comment out or remove `REMOTE_GPU_URL`:
```env
DATABASE_URL=postgresql://neondb_owner:npg_OMhKf9BF5cEC@ep-super-river-azkj7y09-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
SMTP_USER=shakirsar225974@gmail.com
SMTP_PASSWORD=mqcymuedkukfvnul
MODEL_VERSION=v3

# Leave commented for pure local CPU prediction:
# REMOTE_GPU_URL=
```

### Step 2: Ensure Frontend Environment is Local
In `frontend/.env`:
```env
VITE_API_URL=http://localhost:8000/api
```

### Step 3: Start Local Stack
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

## 🛠️ Troubleshooting & FAQ

> [!IMPORTANT]
> **Q: What if the Cloudflare URL changes when I restart Colab?**  
> Every time you restart Cell 5 in Colab, Cloudflare generates a fresh URL. Just update `REMOTE_GPU_URL` in your local `.env` and restart your local backend.

> [!WARNING]
> **Q: Why not run the Scraper in Colab?**  
> Google Colab servers are hosted in US datacenters. Daraz detects foreign datacenter IPs and shows an anti-bot modal (*"Unusual traffic detected"*). Running the scraper on your local PC uses your genuine Sri Lankan residential IP, which Daraz never blocks.

> [!TIP]
> **Q: How do I know if the GPU is actually being used?**  
> Look at your local PC backend console during an analysis. You will see:  
> `[GPU OFFLOAD] Offloading 125 reviews to remote Colab GPU: https://...`  
> `[GPU OFFLOAD] Received 125 predictions from Colab GPU successfully!`
