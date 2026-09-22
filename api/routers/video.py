"""FastAPI router for video generation endpoints."""
from datetime import datetime, timezone
from typing import Dict
import uuid

from fastapi import APIRouter, BackgroundTasks, HTTPException, status

from api.db import create_video_job_record, get_video_job_record
from api.schemas import VideoGenerateRequest, VideoJobResponse, VideoJobStatus
from api.worker import execute_video_pipeline_job

router = APIRouter(prefix="/video", tags=["Video Generation"])


@router.post(
    "/generate",
    response_model=VideoJobResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Trigger automated vertical video generation",
    description="Accepts topic prompt and parameters, enqueues background processing, and returns job tracking details.",
)
async def generate_video_job(
    payload: VideoGenerateRequest,
    background_tasks: BackgroundTasks,
) -> VideoJobResponse:
    """Create a new video generation job and enqueue background processing."""
    job_id = str(uuid.uuid4())
    job = create_video_job_record(
        job_id=job_id,
        topic=payload.topic,
        target_duration=payload.duration,
        voice=payload.voice,
        user_id=payload.user_id,
        video_format=payload.video_format,
        target_platform=payload.target_platform,
        series_id=payload.series_id,
        episode_number=payload.episode_number,
    )
    # Enqueue background task
    background_tasks.add_task(
        execute_video_pipeline_job,
        job_id=job_id,
        topic=payload.topic,
        target_duration=payload.duration,
        voice=payload.voice,
        user_id=payload.user_id,
        publish_youtube=payload.publish_youtube,
        privacy=payload.privacy,
        video_format=payload.video_format,
        target_platform=payload.target_platform,
        mode=payload.mode,
        story_style=payload.story_style,
        characters=payload.characters,
        series_id=payload.series_id,
        episode_number=payload.episode_number,
        music_track=payload.music_track,
        subtitle_style=payload.subtitle_style,
    )
    return job


@router.get(
    "/status/{job_id}",
    response_model=VideoJobResponse,
    summary="Get status of a video generation job",
    description="Returns current status, progress percentage, and final video download URL when completed.",
)
async def get_video_job_status(job_id: str) -> VideoJobResponse:
    """Retrieve job status by job_id."""
    job = get_video_job_record(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video job '{job_id}' not found.",
        )
    return job


@router.get(
    "/install-music-presets",
    summary="Download and install authentic royalty-free music presets",
)
def install_music_presets():
    """Download authentic royalty-free studio audio tracks and install them into assets/audio and web/public/audio/music."""
    import requests
    import shutil
    import subprocess
    from engine.config import PROJECT_ROOT
    from engine.video_renderer import get_ffmpeg_binary

    assets_dir = PROJECT_ROOT / "assets" / "audio"
    web_dir = PROJECT_ROOT / "web" / "public" / "audio" / "music"
    assets_dir.mkdir(parents=True, exist_ok=True)
    web_dir.mkdir(parents=True, exist_ok=True)

    tracks = {
        "cinematic_mystery": "https://upload.wikimedia.org/wikipedia/commons/4/45/Kevin_MacLeod_-_The_Endless.ogg",
        "epic_orchestral": "https://upload.wikimedia.org/wikipedia/commons/9/91/Ride_of_the_Valkyries.ogg",
        "lofi_chill": "https://upload.wikimedia.org/wikipedia/commons/2/20/Gymnopedie_No._2_%28ISRC_USUAN1100786%29.mp3",
        "phonk_tension": "https://upload.wikimedia.org/wikipedia/commons/5/58/Kevin_MacLeod_-_Carefree.ogg",
        "uplifting_emotional": "https://upload.wikimedia.org/wikipedia/commons/2/23/Kevin_MacLeod_-_Windswept.ogg",
    }

    headers = {"User-Agent": "PostMatic-Installer/1.0 (contact@postmatic.app)"}
    ffmpeg = get_ffmpeg_binary()
    results = {}

    for preset_id, url in tracks.items():
        try:
            temp_ext = ".mp3" if url.endswith(".mp3") else (".ogg" if url.endswith(".ogg") else ".oga")
            temp_in = assets_dir / f"{preset_id}_raw{temp_ext}"
            resp = requests.get(url, headers=headers, timeout=30)
            resp.raise_for_status()
            with open(temp_in, "wb") as f:
                f.write(resp.content)

            final_mp3 = assets_dir / f"{preset_id}.mp3"
            if temp_ext == ".mp3":
                shutil.copyfile(temp_in, final_mp3)
            else:
                cmd = [
                    ffmpeg, "-y",
                    "-i", str(temp_in),
                    "-c:a", "libmp3lame",
                    "-b:a", "192k",
                    str(final_mp3)
                ]
                subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

            temp_in.unlink(missing_ok=True)

            # Copy to web public
            web_mp3 = web_dir / f"{preset_id}.mp3"
            shutil.copyfile(final_mp3, web_mp3)
            results[preset_id] = f"Installed ({final_mp3.stat().st_size} bytes)"
        except Exception as e:
            results[preset_id] = f"Error: {e}"

    import json
    with open(assets_dir / "install_log.json", "w") as f:
        json.dump(results, f, indent=2)

    if (assets_dir / "cinematic_mystery.mp3").exists():
        shutil.copyfile(assets_dir / "cinematic_mystery.mp3", assets_dir / "cinematic_ambient.mp3")
        shutil.copyfile(assets_dir / "cinematic_mystery.mp3", web_dir / "cinematic_ambient.mp3")

    return {"status": "success", "results": results}

