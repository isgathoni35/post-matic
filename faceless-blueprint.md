# Faceless Video SaaS: Master Development Blueprint & Agent Directives

## 1. AI Workflow Rules & Operating Directives
To the Antigravity Agent: You are the Principal Software Engineer. You must strictly adhere to the following execution protocols throughout the lifecycle of this project.

- **Step-by-Step Execution:** You are forbidden from jumping ahead. Execute exactly one task from the Progress Tracker at a time. Do not begin the next task until the current one is fully implemented, tested, and confirmed working by the user.
- **Iterative Quality Loops:** If a script fails, a UI component breaks, or an FFmpeg filtergraph errors out, you must loop back, analyze the stack trace, and fix the issue before proceeding. Do not leave broken code behind.
- **Credential Handling Protocol:** You will never attempt to mock, bypass, or guess API keys, OAuth client IDs, or database URIs. When a task requires a secret (e.g., Supabase URL, Gemini API Key, Pexels API Key), you must halt execution, explain exactly how the user can obtain the credential, and wait for the user to provide it securely via environment variables (`.env`).
- **File System Discipline:** Always read the existing codebase before overwriting files to maintain context. Update the Progress Tracker in this document automatically as tasks are completed.

---

## 2. Project Overview & Architecture Context
This project is an automated "faceless" video generation Software as a Service (SaaS) platform. It transforms a single text prompt into a fully edited, captioned, and published vertical video across multiple social media networks without human intervention.

To strictly maintain zero financial operational expenditure (OpEx) for the Minimum Viable Product (MVP), the architecture is highly specific:

### Frontend Architecture (UI Context)
- **Framework:** Next.js (App Router) combined with React to ensure fast load times via Server Components.
- **Styling:** Tailwind CSS paired with Shadcn UI is utilized for a professional, unstyled component dashboard.
- **Hosting:** The frontend will be deployed on Vercel's free "Hobby" tier.

### Backend Architecture & Orchestration
- **Framework:** Python 3.11+ using FastAPI to handle asynchronous I/O operations for heavy media downloading and API calls.
- **Database & Auth:** Supabase provides the managed PostgreSQL database, authentication server, and S3-compatible Object Storage on a free tier. Supabase will also securely store encrypted OAuth 2.0 access and refresh tokens.
- **Video Rendering:** FFmpeg is the core multimedia engine, utilized via Python subprocesses to trim footage, overlay audio, and burn advanced `.ass` subtitles.
- **Distributed Compute Workaround:** Because free hosting tiers (like Koyeb or Render) will crash during heavy video rendering, the heavy compute will be offloaded to GitHub Actions. GitHub Actions will act as an ephemeral compute cluster with 7 GB of RAM to execute the FFmpeg H.264 encoding and push uploads directly to social APIs.

---

## 3. Feature Specifications
The core data flow must process a user prompt through five distinct generation stages:

1. **Scripting (LLM):** Utilize Google Gemini 1.5 Flash API or Groq (Llama-3) to generate a structured JSON payload. The JSON must contain an array of scenes, each with spoken text and a highly descriptive, visually literal search query for stock footage.
2. **Voice Synthesis (TTS):** Use the open-source `edge-tts` Python library to bypass paid APIs. The system must extract exact word-level boundary data (timestamp offsets in milliseconds) from the WebSocket stream to perfectly synchronize animated captions. The output must be an `.ass` (Advanced SubStation Alpha) subtitle file to control text position, color, and drop shadows on a vertical canvas.
3. **Media Sourcing:** Programmatically query the Pexels API and Pixabay API using the LLM-generated keywords to download vertical, high-definition `.mp4` background assets to a temporary buffer.
4. **Programmatic Assembly:** Use FFmpeg to trim the stock footage to exactly match the TTS audio duration utilizing lossless stream copying (`-c copy`). Then, use the concat demuxer and a complex filtergraph (`scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920`) to stitch the final vertical video together with the burned-in `.ass` subtitles.
5. **Social Distribution:** Handle OAuth 2.0 token refreshes autonomously. Utilize the TikTok Content Posting API via chunked HTTP PUT uploads, and the YouTube Data API v3 for distribution.

---

## 4. Progress Tracker (Antigravity Task List)
> **To the Antigravity Agent:** Mark a checkbox with an `[x]` only after the step is fully tested and verified by the user.

### Phase 1: Local Python CLI Engine (Proof of Concept)
- [x] **Step 1.1:** Initialize the Python environment, install `edge-tts`, `ffmpeg-python`, and `pydantic`. Ensure FFmpeg is accessible in the system path.
- [x] **Step 1.2:** Build the LLM Scripting module using the Gemini API. Ensure the output strictly conforms to a Pydantic JSON schema containing scenes, narration, and Pexels search keywords. *Agent: Ask user for Gemini API Key.*
- [x] **Step 1.3:** Build the `edge-tts` wrapper. Synthesize the audio and correctly parse the WebSocket word-level boundaries to generate a perfectly timed `.ass` subtitle file.
- [x] **Step 1.4:** Build the Pexels API downloader. Fetch vertical videos based on scene keywords. *Agent: Ask user for Pexels API Key.*
- [x] **Step 1.5:** Write the FFmpeg orchestrator script to trim the Pexels videos, concatenate them, overlay the audio, and burn the `.ass` subtitles into a final 9:16 `.mp4`. Test the entire CLI pipeline end-to-end.

### Phase 2: FastAPI Backend & Supabase Integration
- [x] **Step 2.1:** Scaffold the FastAPI application (`/api/generate`, `/api/status`).
- [x] **Step 2.2:** Set up Supabase PostgreSQL tables for Users, Video_Jobs, and Social_Accounts. *Agent: Ask user for Supabase URL and Anon Key.*
- [x] **Step 2.3:** Wrap the Phase 1 generation logic into FastAPI BackgroundTasks, updating the Supabase `Video_Jobs` table as each pipeline stage completes.

### Phase 3: Next.js Frontend Dashboard
- [x] **Step 3.1:** Initialize Next.js App Router, Tailwind CSS, and Shadcn UI.
- [x] **Step 3.2:** Build the Supabase Authentication flow (Email/Password or Google OAuth).
- [x] **Step 3.3:** Create the Generation Dashboard UI where users input their video topic and can watch a real-time progress indicator of the backend job status.

### Phase 4: Social OAuth & Cloud Publishing
- [x] **Step 4.1:** Implement the YouTube OAuth 2.0 flow in the frontend, securely sending the refresh tokens to the backend Supabase database.
- [x] **Step 4.2:** Write the backend cron/worker utility to verify token expiration and fetch fresh access tokens prior to publishing.
- [x] **Step 4.3:** Set up the GitHub Actions workflow file (`.github/workflows/render.yml`) to accept a webhook, download assets, run the heavy FFmpeg encoding, and execute the final upload to the social APIs.