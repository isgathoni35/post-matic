"""FastAPI Main Application Entrypoint."""
from datetime import datetime, timezone
import logging
from pathlib import Path
import sys

# Ensure project root is on sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from api.routers import social, video
from api.services.github_dispatcher import is_github_dispatch_enabled
from engine.config import GITHUB_REPO, OUTPUT_DIR

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("postmatic.api")

app = FastAPI(
    title="PostMatic API",
    description="Automated Faceless Vertical Video Generation SaaS Backend Engine",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits local Next.js dev server and Vercel frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static file directory for serving generated video outputs
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/output", StaticFiles(directory=str(OUTPUT_DIR)), name="output")

# Build main API router
api_router = APIRouter(prefix="/api")
api_router.include_router(video.router)
api_router.include_router(social.router)
app.include_router(api_router)


@app.api_route("/", methods=["GET", "HEAD"], tags=["Root"])
async def root():
    """Root entrypoint returning API service status and links."""
    return {
        "status": "online",
        "service": "PostMatic Video Engine API",
        "version": "1.0.0",
        "documentation": "/docs",
        "health_check": "/health",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.api_route("/health", methods=["GET", "HEAD"], tags=["Health Check"])
async def health_check():
    """Health check endpoint for API service monitoring."""
    github_offload = is_github_dispatch_enabled()
    return {
        "status": "ok",
        "service": "postmatic-api",
        "cloud_compute_offload": github_offload,
        "github_repo": GITHUB_REPO if github_offload else None,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)
