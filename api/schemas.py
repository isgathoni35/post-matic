"""Pydantic schemas for FastAPI request and response payloads."""
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import AliasChoices, BaseModel, Field


class VideoJobStatus(str, Enum):
    """Execution status of a video generation background job."""
    PENDING = "pending"
    SCRIPTING = "scripting"
    SYNTHESIZING = "synthesizing"
    SOURCING_MEDIA = "sourcing_media"
    RENDERING = "rendering"
    COMPLETED = "completed"
    FAILED = "failed"


class CustomCharacterPayload(BaseModel):
    """Character definition submitted by the user."""
    name: str = Field(..., min_length=1, max_length=50, description="Character display name")
    voice: Optional[str] = Field(default=None, description="Assigned voice ID or alias")
    image_data: Optional[str] = Field(default=None, description="Base64 data URI or image URL")
    visual_notes: Optional[str] = Field(default=None, description="Optional extra physical styling notes")
    subtitle_color: Optional[str] = Field(default=None, description="Subtitle hex color code")


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
        le=600,
        description="Target duration of video in seconds",
        validation_alias=AliasChoices("duration", "target_duration"),
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
    publish_youtube: bool = Field(
        default=False,
        description="Whether to automatically publish rendered video to YouTube Shorts",
    )
    privacy: str = Field(
        default="public",
        description="YouTube privacy setting ('public', 'unlisted', 'private')",
    )
    user_id: Optional[str] = Field(
        default=None,
        description="Owner user UUID for social account credentials lookup",
    )
    video_format: str = Field(
        default="short",
        description="Video aspect ratio format ('short' for 9:16 vertical or 'long' for 16:9 widescreen)",
    )
    target_platform: str = Field(
        default="youtube",
        description="Destination platform ('youtube', 'tiktok', 'instagram')",
    )
    mode: str = Field(
        default="shorts",
        description="Generation mode: 'shorts' for faceless stock footage or 'story' for animated multi-character story",
    )
    story_style: str = Field(
        default="anime",
        description="Style for animated story ('anime', 'donghua', 'stickman', '3d_cartoon')",
    )
    characters: Optional[List[CustomCharacterPayload]] = Field(
        default=None,
        description="Optional list of custom characters with names, voices, and reference photos",
    )
    series_id: Optional[str] = Field(
        default=None,
        description="Optional Series UUID to link this episode to a continuous universe",
    )
    episode_number: Optional[int] = Field(
        default=None,
        description="Episode sequence number within the series",
    )


class PublishVideoRequest(BaseModel):
    """Payload to trigger publishing an existing rendered video to social platforms."""
    user_id: Optional[str] = Field(
        default=None,
        description="Owner user UUID for social account credentials lookup",
    )
    platform: str = Field(
        default="youtube",
        description="Target social platform ('youtube', 'tiktok', 'instagram')",
    )
    privacy: str = Field(
        default="public",
        description="Privacy setting ('public', 'unlisted', 'private')",
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
    series_id: Optional[str] = Field(None, description="Associated Series UUID")
    episode_number: Optional[int] = Field(None, description="Episode sequence number")


class SocialAuthUrlResponse(BaseModel):
    """OAuth consent authorization URL payload."""
    auth_url: str = Field(..., description="OAuth 2.0 authorization URL")
    platform: str = Field(default="youtube", description="Social platform name ('youtube', 'tiktok', 'instagram')")


class SocialAccountResponse(BaseModel):
    """Connected social media account record."""
    id: str = Field(..., description="Unique UUID of the connected account record")
    user_id: Optional[str] = Field(None, description="Owner user UUID")
    platform: str = Field(..., description="Platform name ('youtube', 'tiktok', 'instagram')")
    account_name: Optional[str] = Field(None, description="Display name / Channel title")
    has_refresh_token: bool = Field(default=True, description="Whether a persistent refresh token is stored")
    token_expires_at: Optional[str] = Field(None, description="ISO timestamp of token expiration")
    created_at: str = Field(..., description="ISO 8601 creation timestamp")
    updated_at: str = Field(..., description="ISO 8601 update timestamp")


class CreateSeriesRequest(BaseModel):
    """Payload to create a new narrative series."""
    user_id: str = Field(..., description="User UUID owning the series")
    title: str = Field(..., min_length=1, max_length=150, description="Title of the series")
    genre: Optional[str] = Field(default=None, description="Genre (e.g. 'Sci-Fi', 'Historical', 'Finance')")
    tone: Optional[str] = Field(default=None, description="Tone (e.g. 'Dramatic', 'Comedic', 'Fast-Paced')")
    premise: Optional[str] = Field(default=None, description="Core series premise or narrative universe")
    world_rules: Optional[List[str]] = Field(default=None, description="Key rules and lore constraints")
    recurring_characters: Optional[List[Any]] = Field(default=None, description="Recurring cast members")


class UpdateSeriesBibleRequest(BaseModel):
    """Payload to update Show Bible attributes manually."""
    premise: Optional[str] = None
    world_rules: Optional[List[str]] = None
    tone: Optional[str] = None
    recurring_characters: Optional[List[Any]] = None


class SeriesResponse(BaseModel):
    """Detailed series schema including its Show Bible and episode count."""
    id: str = Field(..., description="Unique UUID of the series")
    user_id: str = Field(..., description="Owner user UUID")
    title: str = Field(..., description="Series title")
    genre: Optional[str] = Field(default=None)
    tone: Optional[str] = Field(default=None)
    bible_json: Optional[dict] = Field(default_factory=dict)
    episode_count: int = Field(default=0)
    created_at: str = Field(...)
    updated_at: str = Field(...)
    episodes: Optional[List[dict]] = Field(default=None)
