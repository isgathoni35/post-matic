"""Pydantic schemas for FastAPI request and response payloads."""
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class VideoJobStatus(str, Enum):
    """Execution status of a video generation background job."""
    PENDING = "pending"
    SCRIPTING = "scripting"
    SYNTHESIZING = "synthesizing"
    SOURCING_MEDIA = "sourcing_media"
    RENDERING = "rendering"
    COMPLETED = "completed"
    FAILED = "failed"


class VideoGenerateRequest(BaseModel):
    """Payload to request automated video generation."""
    topic: str = Field(
        ...,
        min_length=3,
        max_length=300,
        description="Topic or prompt for the vertical video",
        examples=["3 mind-blowing facts about space"],
    )
    duration: int = Field(
        default=25,
        ge=10,
        le=120,
        description="Target duration of video in seconds",
    )
    voice: Optional[str] = Field(
        default=None,
        description="Neural voice alias or name (e.g. 'guy', 'en-US-ChristopherNeural')",
    )
    words_per_subtitle_line: int = Field(
        default=3,
        ge=1,
        le=10,
        description="Number of words displayed per animated subtitle line",
    )


class VideoJobResponse(BaseModel):
    """Detailed response schema for a video job status or creation payload."""
    job_id: str = Field(..., description="Unique UUID or identifier of the video job")
    topic: str = Field(..., description="Original video topic")
    status: VideoJobStatus = Field(..., description="Current job status stage")
    progress_pct: int = Field(default=0, ge=0, le=100, description="Approximate progress percentage")
    created_at: str = Field(..., description="ISO 8601 creation timestamp")
    updated_at: str = Field(..., description="ISO 8601 last update timestamp")
    video_url: Optional[str] = Field(None, description="Public download path/URL if completed")
    duration_seconds: Optional[float] = Field(None, description="Final video duration in seconds")
    file_size_bytes: Optional[int] = Field(None, description="Final video file size in bytes")
    error_message: Optional[str] = Field(None, description="Failure reason if status is failed")


class SocialAuthUrlResponse(BaseModel):
    """OAuth consent authorization URL payload."""
    auth_url: str = Field(..., description="Google OAuth 2.0 authorization URL")
    platform: str = Field(default="youtube", description="Social platform name")


class SocialAccountResponse(BaseModel):
    """Connected social media account record."""
    id: str = Field(..., description="Unique UUID of the connected account record")
    user_id: Optional[str] = Field(None, description="Owner user UUID")
    platform: str = Field(..., description="Platform name ('youtube' or 'tiktok')")
    account_name: Optional[str] = Field(None, description="Display name / Channel title")
    has_refresh_token: bool = Field(default=True, description="Whether a persistent refresh token is stored")
    token_expires_at: Optional[str] = Field(None, description="ISO timestamp of token expiration")
    created_at: str = Field(..., description="ISO 8601 creation timestamp")
    updated_at: str = Field(..., description="ISO 8601 update timestamp")
