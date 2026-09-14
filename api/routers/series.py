"""FastAPI router for Series Ecosystem endpoints."""

import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status

from api.db import get_supabase_client
from api.schemas import CreateSeriesRequest, SeriesResponse, UpdateSeriesBibleRequest
from engine.series_engine import (
    create_series,
    delete_series,
    get_series,
    list_user_series,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/series", tags=["Series Ecosystem"])


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
    )
    return SeriesResponse(
        id=record["id"],
        user_id=record["user_id"],
        title=record["title"],
        genre=record.get("genre"),
        tone=record.get("tone"),
        bible_json=record.get("bible_json") or {},
        episode_count=record.get("episode_count") or 0,
        created_at=record["created_at"],
        updated_at=record["updated_at"],
        episodes=[],
    )


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
    return [
        SeriesResponse(
            id=s["id"],
            user_id=s["user_id"],
            title=s["title"],
            genre=s.get("genre"),
            tone=s.get("tone"),
            bible_json=s.get("bible_json") or {},
            episode_count=s.get("episode_count") or 0,
            created_at=s["created_at"],
            updated_at=s["updated_at"],
        )
        for s in series_list
    ]


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

    return SeriesResponse(
        id=series["id"],
        user_id=series["user_id"],
        title=series["title"],
        genre=series.get("genre"),
        tone=series.get("tone"),
        bible_json=series.get("bible_json") or {},
        episode_count=series.get("episode_count") or 0,
        created_at=series["created_at"],
        updated_at=series["updated_at"],
        episodes=episodes,
    )


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

    client = get_supabase_client()
    if client:
        try:
            client.table("series").update({"bible_json": bible}).eq("id", series_id).execute()
        except Exception as e:
            logger.warning("Failed to update bible in Supabase: %s", e)

    series["bible_json"] = bible
    return SeriesResponse(
        id=series["id"],
        user_id=series["user_id"],
        title=series["title"],
        genre=series.get("genre"),
        tone=series.get("tone"),
        bible_json=bible,
        episode_count=series.get("episode_count") or 0,
        created_at=series["created_at"],
        updated_at=series["updated_at"],
    )


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
