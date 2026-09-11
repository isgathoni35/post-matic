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
