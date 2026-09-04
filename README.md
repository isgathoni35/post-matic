# 🎬 PostMatic: Autonomous Faceless Video SaaS

PostMatic is a full-stack, zero-OpEx autonomous faceless video generator and social publisher tailored for **YouTube Shorts**, **TikTok**, and **Instagram Reels**. It orchestrates scriptwriting, voiceover synthesis, synchronized subtitles, stock video b-roll fetching, and FFmpeg assembly into high-retention 9:16 vertical videos.

---

## 🌟 Key Features

- 🧠 **AI Scriptwriter:** Structured multi-scene JSON scripting via **Google Gemini 3.7 / 3.6 / 3.5 Flash** with strict Pydantic schemas.
- 🎙️ **Neural Voiceover:** High-fidelity speech synthesis with sub-second word-boundary offsets using **Microsoft `edge-tts`**.
- 📝 **Dynamic Karaoke Captions:** Automated `.ass` subtitle generator with custom styles (The Bold Highlight, Sunset Glow, Neon Cyber, Sleek Minimal).
- 🎥 **Smart B-Roll Sourcing:** Automated 9:16 vertical 4K/HD video clip downloader via **Pexels Video API**.
- 🎞️ **FFmpeg Video Stitcher:** Hardware-accelerated H.264/AAC video rendering and audio mixing.
- 📱 **Google/Linear-Grade Studio UI:** Next.js 16 + React 19 + Tailwind CSS dashboard with a live 9:16 smartphone player, multi-view workspaces (*Studio Console*, *Render Library*, *Job Queue*, *Social Channels*, *Engine Logs*, *Settings*).
- 🔐 **OAuth 2.0 & Cloud Publishing:** Direct resumable chunked video upload to **YouTube Data API v3** with automated token expiration checks and background refresh worker.
- ⚡ **Zero-OpEx Compute:** Ephemeral GitHub Actions runners (`.github/workflows/render.yml`) for heavy cloud rendering and publishing.

---

## 🛠️ Architecture & Tech Stack

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Backend API** | FastAPI + Uvicorn (Python 3.12) | Asynchronous orchestration daemon & endpoints |
| **Frontend UI** | Next.js 16 (Turbopack) + React 19 + Tailwind CSS | Studio control room & multi-workspace interface |
| **Database & Auth** | Supabase (PostgreSQL + RLS + GoTrue) | User authentication, job queue, social accounts |
| **LLM Engine** | Google Gemini (google-genai SDK) | Structured scene-by-scene script writing |
| **TTS Synthesis** | Microsoft edge-tts | Zero-cost neural voice synthesis |
| **Media Sourcing** | Pexels Video API v1 | Free high-definition vertical video clips |
| **Video Processing**| FFmpeg + libass (imageio-ffmpeg) | Video scaling, clipping, subtitle burning, concatenation |
| **Cloud Worker** | GitHub Actions | Distributed cloud compute for rendering & publishing |

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Python 3.12+**
- **Node.js 20+**
- **FFmpeg** (automatically managed via `imageio-ffmpeg` or system PATH)

### 2. Backend Setup (Terminal 1)

In the root directory of the repository:

```bash
# 1. Create virtual environment (if not already created)
python -m venv .venv

# 2. Activate virtual environment
# On Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# If PowerShell script execution is restricted, run:
# Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# On Linux/macOS:
source .venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment variables
# Copy .env.example to .env and fill in your keys (GEMINI_API_KEY, PEXELS_API_KEY, SUPABASE keys)
cp .env.example .env

# 5. Start the FastAPI backend server
python -m uvicorn api.main:app --reload --port 8000
```

> **FastAPI Backend URL:** [http://localhost:8000](http://localhost:8000)  
> **Interactive Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)  
> **Health Check:** [http://localhost:8000/health](http://localhost:8000/health)

---

### 3. Frontend Setup (Terminal 2)

In a separate terminal tab, navigate to the `web` directory:

```bash
cd web

# 1. Install dependencies
npm install

# 2. Configure environment variables
# Ensure web/.env.local contains:
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
# NEXT_PUBLIC_API_URL=http://localhost:8000

# 3. Start the Next.js development server
npm run dev
```

> **Frontend Dashboard:** [http://localhost:3001](http://localhost:3001) (or `http://localhost:3000` if default port is used)

---

### 4. Local Development Verification

Once both servers are running:
1. Open **[http://localhost:3001](http://localhost:3001)** in your browser.
2. Sign in or explore the landing page and Studio Console.
3. Your frontend will communicate directly with your local backend at `http://localhost:8000`. You can monitor backend logs live in Terminal 1.

---

## 🧪 Testing Suite

Run the full automated test suite (32 unit & integration tests):
```bash
pytest -v
```

---

## 🔑 Environment Variables

| Variable | Description |
| :--- | :--- |
| `GEMINI_API_KEY` | Google AI Studio API key |
| `PEXELS_API_KEY` | Pexels Developer API key |
| `SUPABASE_URL` | Supabase project URL (`https://xyz.supabase.co`) |
| `SUPABASE_KEY` | Supabase public `anon` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase secret `service_role` key |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 Web Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 Web Client Secret |
| `GOOGLE_REDIRECT_URI` | `http://localhost:8000/api/social/youtube/callback` (or production URL) |
| `FRONTEND_URL` | `http://localhost:3001` (or production URL) |

---

## 📄 License
MIT License. Created with ❤️ for autonomous content creators.
