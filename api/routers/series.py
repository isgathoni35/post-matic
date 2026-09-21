"""FastAPI router for Series Ecosystem endpoints."""

import logging
from typing import List, Optional
from fastapi import APIRouter, BackgroundTasks, Header, HTTPException, Query, status

from api.db import get_supabase_client
from api.schemas import (
    AutopilotDispatchResponse,
    CreateSeriesRequest,
    SeriesResponse,
    UpdateSeriesBibleRequest,
)
from engine.config import AUTOPILOT_SECRET
from engine.series_engine import (
    calculate_initial_next_post_at,
    calculate_next_post_at,
    create_series,
    delete_series,
    dispatch_due_autopilot_series,
    get_series,
    list_user_series,
    toggle_series_autopilot,
    trigger_series_autopilot_now,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/series", tags=["Series Ecosystem"])


def _to_series_response(record: dict, episodes: Optional[list] = None) -> SeriesResponse:
    """Helper to cleanly serialize series database/memory records into SeriesResponse."""
    bible = record.get("bible_json") or {}
    return SeriesResponse(
        id=record["id"],
        user_id=record["user_id"],
        title=record["title"],
        genre=record.get("genre") or bible.get("genre"),
        tone=record.get("tone") or bible.get("tone"),
        niche=record.get("niche") or bible.get("niche", "scary_stories"),
        art_style=record.get("art_style") or bible.get("art_style", "cinematic_dark"),
        voice=record.get("voice") or bible.get("voice", "en-US-BrianMultilingualNeural"),
        music_track=record.get("music_track") or bible.get("music_track", "cinematic_mystery"),
        subtitle_style=record.get("subtitle_style") or bible.get("subtitle_style", "hormozi_yellow"),
        autopilot_enabled=bool(record.get("autopilot_enabled", bible.get("autopilot_enabled", False))),
        post_frequency_per_day=int(record.get("post_frequency_per_day", bible.get("post_frequency_per_day", 1))),
        preferred_time_utc=str(record.get("preferred_time_utc", bible.get("preferred_time_utc", "18:00"))),
        target_platforms=record.get("target_platforms") or bible.get("target_platforms") or ["youtube"],
        require_approval=bool(record.get("require_approval", bible.get("require_approval", False))),
        last_posted_at=record.get("last_posted_at"),
        next_post_at=record.get("next_post_at"),
        bible_json=bible,
        episode_count=record.get("episode_count") or 0,
        created_at=record["created_at"],
        updated_at=record["updated_at"],
        episodes=episodes,
    )


@router.post(
    "",
    response_model=SeriesResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new serialized content universe",
    description="Initializes a new series record with an AI-managed Show Bible.",
)
async def create_new_series(payload: CreateSeriesRequest) -> SeriesResponse:
    """Create a new series."""
    record = create_series(
        user_id=payload.user_id,
        title=payload.title,
        genre=payload.genre,
        tone=payload.tone,
        premise=payload.premise,
        world_rules=payload.world_rules,
        recurring_characters=payload.recurring_characters,
        niche=payload.niche,
        art_style=payload.art_style,
        voice=payload.voice,
        music_track=payload.music_track,
        subtitle_style=payload.subtitle_style,
        autopilot_enabled=payload.autopilot_enabled,
        post_frequency_per_day=payload.post_frequency_per_day,
        preferred_time_utc=payload.preferred_time_utc,
        target_platforms=payload.target_platforms,
        require_approval=payload.require_approval,
    )
    return _to_series_response(record, episodes=[])


@router.get(
    "",
    response_model=List[SeriesResponse],
    summary="List all series belonging to a user",
)
async def get_user_series_list(
    user_id: Optional[str] = Query(None, description="Owner user UUID"),
) -> List[SeriesResponse]:
    """List series."""
    series_list = list_user_series(user_id)
    return [_to_series_response(s) for s in series_list]


@router.post(
    "/autopilot/dispatch",
    response_model=AutopilotDispatchResponse,
    summary="Trigger hourly autopilot scheduler evaluation",
    description="Evaluates all active autopilot series, generates due episodes from the Show Bible, and enqueues video jobs.",
)
async def trigger_autopilot_dispatch(
    background_tasks: BackgroundTasks,
    x_autopilot_secret: Optional[str] = Header(None, alias="X-Autopilot-Secret"),
) -> AutopilotDispatchResponse:
    """Evaluates due series and dispatches automated video generation jobs."""
    if AUTOPILOT_SECRET:
        if not x_autopilot_secret or x_autopilot_secret.strip() != AUTOPILOT_SECRET.strip():
            logger.warning("Unauthorized autopilot dispatch attempt: invalid secret header")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unauthorized: invalid or missing X-Autopilot-Secret header",
            )
    else:
        logger.info("Autopilot dispatch invoked without configured AUTOPILOT_SECRET (open mode).")

    result = dispatch_due_autopilot_series(background_tasks=background_tasks)
    return AutopilotDispatchResponse(
        checked_count=result["checked_count"],
        dispatched_count=result["dispatched_count"],
        dispatched_jobs=result["dispatched_jobs"],
    )


@router.get(
    "/{series_id}",
    response_model=SeriesResponse,
    summary="Get series details with episode history and Show Bible",
)
async def get_series_detail(series_id: str) -> SeriesResponse:
    """Get single series details with linked episodes."""
    series = get_series(series_id)
    if not series:
        raise HTTPException(status_code=404, detail=f"Series '{series_id}' not found")

    # Fetch associated episodes from video_jobs
    episodes = []
    client = get_supabase_client()
    if client:
        try:
            res = (
                client.table("video_jobs")
                .select("id, topic, status, video_url, duration_seconds, episode_number, created_at")
                .eq("series_id", series_id)
                .order("created_at", desc=False)
                .execute()
            )
            if res.data:
                episodes = res.data
        except Exception as e:
            logger.warning("Failed to fetch episodes for series %s: %s", series_id, e)

    return _to_series_response(series, episodes=episodes)


@router.patch(
    "/{series_id}/bible",
    response_model=SeriesResponse,
    summary="Manually update Show Bible attributes",
)
async def update_bible(
    series_id: str,
    payload: UpdateSeriesBibleRequest,
) -> SeriesResponse:
    """Update Show Bible."""
    series = get_series(series_id)
    if not series:
        raise HTTPException(status_code=404, detail=f"Series '{series_id}' not found")

    bible = series.get("bible_json") or {}
    if payload.premise is not None:
        bible["premise"] = payload.premise
    if payload.world_rules is not None:
        bible["world_rules"] = payload.world_rules
    if payload.tone is not None:
        bible["tone"] = payload.tone
    if payload.recurring_characters is not None:
        bible["recurring_characters"] = payload.recurring_characters
    if payload.niche is not None:
        bible["niche"] = payload.niche
        series["niche"] = payload.niche
    if payload.art_style is not None:
        bible["art_style"] = payload.art_style
        series["art_style"] = payload.art_style
    if payload.voice is not None:
        bible["voice"] = payload.voice
        series["voice"] = payload.voice
    if payload.music_track is not None:
        bible["music_track"] = payload.music_track
        series["music_track"] = payload.music_track
    if payload.subtitle_style is not None:
        bible["subtitle_style"] = payload.subtitle_style
        series["subtitle_style"] = payload.subtitle_style
    if payload.autopilot_enabled is not None:
        bible["autopilot_enabled"] = payload.autopilot_enabled
        series["autopilot_enabled"] = payload.autopilot_enabled
    if payload.post_frequency_per_day is not None:
        bible["post_frequency_per_day"] = payload.post_frequency_per_day
        series["post_frequency_per_day"] = payload.post_frequency_per_day
    if payload.preferred_time_utc is not None:
        bible["preferred_time_utc"] = payload.preferred_time_utc
        series["preferred_time_utc"] = payload.preferred_time_utc
    if payload.target_platforms is not None:
        bible["target_platforms"] = payload.target_platforms
        series["target_platforms"] = payload.target_platforms
    if payload.require_approval is not None:
        bible["require_approval"] = payload.require_approval
        series["require_approval"] = payload.require_approval

    # Auto-recalculate next_post_at when scheduling settings are altered
    if series.get("autopilot_enabled"):
        if payload.autopilot_enabled is True or payload.preferred_time_utc is not None or payload.post_frequency_per_day is not None or not series.get("next_post_at"):
            pref = str(series.get("preferred_time_utc") or "18:00")
            freq = int(series.get("post_frequency_per_day") or 1)
            new_next_post = calculate_initial_next_post_at(pref, freq)
            series["next_post_at"] = new_next_post
            bible["next_post_at"] = new_next_post
    elif payload.autopilot_enabled is False:
        series["next_post_at"] = None
        bible["next_post_at"] = None

    updates = {
        "bible_json": bible,
        "niche": series.get("niche"),
        "art_style": series.get("art_style"),
        "voice": series.get("voice"),
        "music_track": series.get("music_track"),
        "subtitle_style": series.get("subtitle_style"),
        "autopilot_enabled": bool(series.get("autopilot_enabled", False)),
        "post_frequency_per_day": int(series.get("post_frequency_per_day", 1)),
        "preferred_time_utc": str(series.get("preferred_time_utc", "18:00")),
        "target_platforms": series.get("target_platforms") or ["youtube"],
        "require_approval": bool(series.get("require_approval", False)),
        "next_post_at": series.get("next_post_at"),
    }

    client = get_supabase_client()
    if client:
        try:
            client.table("series").update(updates).eq("id", series_id).execute()
        except Exception as e:
            logger.warning("Failed to update full series row in Supabase: %s (falling back to bible_json only)", e)
            try:
                client.table("series").update({"bible_json": bible}).eq("id", series_id).execute()
            except Exception as e2:
                logger.warning("Fallback bible update also failed: %s", e2)

    series["bible_json"] = bible
    return _to_series_response(series)



@router.delete(
    "/{series_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a series",
)
async def delete_existing_series(series_id: str):
    """Delete a series record."""
    series = get_series(series_id)
    if not series:
        raise HTTPException(status_code=404, detail=f"Series '{series_id}' not found")

    delete_series(series_id)
    return None


@router.post(
    "/{series_id}/autopilot/trigger",
    summary="1-click manual trigger override for a specific series",
    description="Forces immediate generation of the next episode for this series regardless of schedule.",
)
async def trigger_specific_series_autopilot(
    series_id: str,
    background_tasks: BackgroundTasks,
):
    """Manually dispatch next episode for this specific series immediately."""
    series = get_series(series_id)
    if not series:
        raise HTTPException(status_code=404, detail=f"Series '{series_id}' not found")

    try:
        dispatched = trigger_series_autopilot_now(series_id, background_tasks=background_tasks)
        return {
            "status": "dispatched",
            "message": f"Queued Episode #{dispatched['episode_number']} for '{dispatched['series_title']}'",
            "job": dispatched,
        }
    except Exception as e:
        logger.exception("Failed to trigger manual autopilot for series %s: %s", series_id, e)
        raise HTTPException(status_code=500, detail=f"Failed to trigger episode: {str(e)}")


@router.patch(
    "/{series_id}/autopilot/toggle",
    response_model=SeriesResponse,
    summary="Quickly toggle autopilot status for a series",
)
async def toggle_autopilot_endpoint(
    series_id: str,
    enabled: bool = Query(..., description="Whether autopilot is enabled"),
):
    """Toggle autopilot active/inactive."""
    series = get_series(series_id)
    if not series:
        raise HTTPException(status_code=404, detail=f"Series '{series_id}' not found")

    updated = toggle_series_autopilot(series_id, enabled)
    return _to_series_response(updated)

