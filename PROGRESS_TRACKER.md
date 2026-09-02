# Project Progress Tracker

> **Execution Protocol:** Checkboxes are marked with `[x]` only after the step is fully implemented, tested, and confirmed working by the user.

---

### Phase 1: Local Python CLI Engine (Proof of Concept)
- [x] **Step 1.1:** Initialize the Python environment, install `edge-tts`, `ffmpeg-python`, and `pydantic`. Ensure FFmpeg is accessible in the system path.
- [x] **Step 1.2:** Build the LLM Scripting module using the Gemini API. Ensure the output strictly conforms to a Pydantic JSON schema containing scenes, narration, and Pexels search keywords. *(Agent: Ask user for Gemini API Key)*
- [x] **Step 1.3:** Build the `edge-tts` wrapper. Synthesize the audio and correctly parse the WebSocket word-level boundaries to generate a perfectly timed `.ass` subtitle file.
- [x] **Step 1.4:** Build the Pexels API downloader. Fetch vertical videos based on scene keywords. *(Agent: Ask user for Pexels API Key)*
- [x] **Step 1.5:** Write the FFmpeg orchestrator script to trim the Pexels videos, concatenate them, overlay the audio, and burn the `.ass` subtitles into a final 9:16 `.mp4`. Test the entire CLI pipeline end-to-end.

---

### Phase 2: FastAPI Backend & Supabase Integration
- [x] **Step 2.1:** Scaffold the FastAPI application (`/api/generate`, `/api/status`).
- [x] **Step 2.2:** Set up Supabase PostgreSQL tables for `users`, `video_jobs`, and `social_accounts`. *(Agent: Ask user for Supabase URL and Anon Key)*
- [x] **Step 2.3:** Wrap the Phase 1 generation logic into FastAPI `BackgroundTasks`, updating the Supabase `video_jobs` table as each pipeline stage completes.

---

### Phase 3: Next.js Frontend Dashboard
- [x] **Step 3.1:** Initialize Next.js App Router, Tailwind CSS, and Shadcn UI.
- [x] **Step 3.2:** Build the Supabase Authentication flow (Email/Password or Google OAuth).
- [x] **Step 3.3:** Create the Generation Dashboard UI where users input their video topic and can watch a real-time progress indicator of the backend job status.

---

### Phase 4: Social OAuth & Cloud Publishing
- [x] **Step 4.1:** Implement the YouTube OAuth 2.0 flow in the frontend, securely sending the refresh tokens to the backend Supabase database.
- [x] **Step 4.2:** Write the backend cron/worker utility to verify token expiration and fetch fresh access tokens prior to publishing.
- [x] **Step 4.3:** Set up the GitHub Actions workflow file (`.github/workflows/render.yml`) to accept a webhook, download assets, run the heavy FFmpeg encoding, and execute the final upload to the social APIs.

---

### Phase 5: Distributed Cloud Compute & 1-Click Publishing
- [x] **Step 5.1:** Add root service health and metadata route (`GET /`) to FastAPI backend for Render deployment.
- [x] **Step 5.2:** Connect FastAPI backend to GitHub Actions via `repository_dispatch` to offload heavy FFmpeg rendering to GitHub's free 7 GB RAM runner, avoiding Render 512 MB OOM crashes.
- [x] **Step 5.3:** Implement autonomous 1-click & auto-publishing flow to YouTube Shorts (`POST /api/social/publish/{job_id}`) across both backend API and frontend Next.js console/library views.
