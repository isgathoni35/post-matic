# Architecture & Zero-OpEx Stack Guidelines

## Project Mission
Automated "faceless" video generation SaaS platform that transforms a single text prompt into a fully edited, captioned, and published vertical (9:16) video across social platforms without human intervention, strictly maintaining **Zero Financial Operational Expenditure (OpEx)** for the MVP.

## Architecture Specifications

### 1. Frontend Architecture
- **Framework:** Next.js (App Router) + React (Server Components for performance).
- **Styling & UI:** Tailwind CSS paired with Shadcn UI for clean, modern, unstyled component primitives.
- **Deployment Target:** Vercel Hobby Free Tier.

### 2. Backend & Database Architecture
- **Framework:** Python 3.11+ using FastAPI (asynchronous I/O for heavy media downloading & orchestration).
- **Database & Auth & Storage:** Supabase (PostgreSQL, Auth server, S3-compatible Storage on Free Tier). Securely stores encrypted OAuth 2.0 access and refresh tokens.
- **Multimedia Engine:** FFmpeg invoked via Python subprocesses for frame-accurate video trimming, audio overlay, and `.ass` subtitle burning.

### 3. Distributed Compute Workaround
- Video rendering and encoding (H.264) can exceed free-tier limits of web hosts (Render/Koyeb).
- Heavy FFmpeg compute is offloaded to GitHub Actions ephemeral runners (7GB RAM) triggered via webhooks/dispatch, publishing directly to social APIs.

## 5-Stage Core Video Pipeline
1. **Scripting (LLM):** Google Gemini 1.5 Flash API (or Groq Llama-3) returning strict Pydantic JSON schemas with scene-by-scene narration and visually literal stock search keywords.
2. **Voice Synthesis (TTS):** `edge-tts` extracting exact millisecond-accurate word-level boundary offsets from WebSocket streams to produce styled `.ass` subtitle files.
3. **Media Sourcing:** Querying Pexels API and Pixabay API for HD vertical (9:16) MP4 background clips.
4. **Programmatic Assembly:** FFmpeg trimming with `-c copy`, concat demuxing, aspect ratio normalization (`scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920`), and burning `.ass` subtitles.
5. **Social Distribution:** Autonomous OAuth 2.0 refresh, YouTube Data API v3 and TikTok Content Posting API chunked upload distribution.
