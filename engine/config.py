"""Core configuration for the Faceless Video Engine."""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Base paths
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

OUTPUT_DIR = PROJECT_ROOT / "output"
TEMP_DIR = PROJECT_ROOT / "temp"

# Load environment variables
load_dotenv(dotenv_path=PROJECT_ROOT / ".env")

# API Keys & Supabase Credentials
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
PEXELS_API_KEY = os.getenv("PEXELS_API_KEY", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

# Google OAuth 2.0 (YouTube Data API v3)
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/social/youtube/callback")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3001")

# TikTok Login Kit & Content Posting API
TIKTOK_CLIENT_KEY = os.getenv("TIKTOK_CLIENT_KEY", "")
TIKTOK_CLIENT_SECRET = os.getenv("TIKTOK_CLIENT_SECRET", "")
TIKTOK_REDIRECT_URI = os.getenv("TIKTOK_REDIRECT_URI", "http://localhost:8000/api/social/tiktok/callback")

# Meta for Developers (Instagram Graph API & Reels Publishing)
META_APP_ID = os.getenv("META_APP_ID", "")
META_APP_SECRET = os.getenv("META_APP_SECRET", "")
INSTAGRAM_REDIRECT_URI = os.getenv("INSTAGRAM_REDIRECT_URI", "http://localhost:8000/api/social/instagram/callback")

# GitHub Actions Distributed Cloud Compute
GITHUB_PAT = os.getenv("GITHUB_PAT", "")
GITHUB_REPO = os.getenv("GITHUB_REPO", "isgathoni35/post-matic")

# Autopilot Scheduler Security
AUTOPILOT_SECRET = os.getenv("AUTOPILOT_SECRET", "")

# Gemini model fallback hierarchy
GEMINI_MODELS = [
    "gemini-2.5-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-2.5-pro",
    "gemini-flash-latest",
]

# AI Image Generation Fallback (Google Imagen 3 / Nano Banana)
ENABLE_AI_IMAGE_FALLBACK = os.getenv("ENABLE_AI_IMAGE_FALLBACK", "true").lower() in ("true", "1", "yes")
IMAGEN_MODELS = [
    "imagen-3.0-generate-002",
    "imagen-3.0-fast-generate-001",
]

# Ensure working directories exist
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
TEMP_DIR.mkdir(parents=True, exist_ok=True)
