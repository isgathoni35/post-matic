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

### 2. Backend Setup
```bash
# Create and activate virtual environment
python -m venv .venv
# On Windows:
.\.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env and supply your GEMINI_API_KEY, PEXELS_API_KEY, SUPABASE keys, and GOOGLE OAuth credentials

# Start FastAPI server
python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend Setup
```bash
cd web
npm install
cp .env.example .env.local
npm run dev
```
Open **`http://localhost:3001`** in your browser.

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
