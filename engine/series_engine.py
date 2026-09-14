"""Series Ecosystem Engine: Manages Show Bibles, continuity prompts, and series state."""

import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid

from api.db import get_supabase_client

logger = logging.getLogger(__name__)

# Fallback in-memory store for series when Supabase is unreachable or in tests
IN_MEMORY_SERIES: Dict[str, Dict[str, Any]] = {}


def get_iso_now() -> str:
    """Get current UTC time in ISO 8601 string format."""
    return datetime.now(timezone.utc).isoformat()


def build_series_context_prompt(
    bible_json: Optional[Dict[str, Any]],
    next_episode_num: Optional[int] = None,
) -> str:
    """Formats the Show Bible into a structured system prompt context for Gemini.

    Ensures continuity across character arcs, lore, previous episode plot points,
    and thematic tone.
    """
    if not bible_json:
        return ""

    lines: List[str] = []
    lines.append("=== SHOW BIBLE & CONTINUITY CONTEXT ===")

    if bible_json.get("title"):
        lines.append(f"Series Title: {bible_json['title']}")

    if bible_json.get("genre"):
        lines.append(f"Genre: {bible_json['genre']}")

    if bible_json.get("tone"):
        lines.append(f"Tone: {bible_json['tone']}")

    if bible_json.get("premise"):
        lines.append(f"Overarching Premise: {bible_json['premise']}")

    world_rules = bible_json.get("world_rules")
    if world_rules and isinstance(world_rules, list) and len(world_rules) > 0:
        lines.append("\nWorld Rules & Lore Constraints:")
        for r in world_rules:
            lines.append(f"  - {r}")

    characters = bible_json.get("recurring_characters")
    if characters and isinstance(characters, list) and len(characters) > 0:
        lines.append("\nRecurring Cast:")
        for c in characters:
            if isinstance(c, dict):
                lines.append(f"  - {c.get('name', 'Unknown')}: {c.get('description', '')}")
            else:
                lines.append(f"  - {c}")

    episodes = bible_json.get("episode_summaries", [])
    if episodes and isinstance(episodes, list) and len(episodes) > 0:
        lines.append("\nCanon Episode History (Previous Events):")
        # Keep last 5 episodes to stay within token budget while preserving immediate continuity
        recent_episodes = episodes[-5:]
        for ep in recent_episodes:
            if isinstance(ep, dict):
                ep_num = ep.get("ep", "?")
                ep_title = ep.get("title", f"Episode {ep_num}")
                ep_summary = ep.get("summary", "")
                lines.append(f"  * Ep {ep_num} ({ep_title}): {ep_summary}")
            else:
                lines.append(f"  * {ep}")

    if next_episode_num is not None:
        lines.append(f"\nCURRENT TASK: You are writing Episode {next_episode_num}. Advance the overarching story naturally without repeating previous episode conclusions.")

    lines.append("========================================\n")
    return "\n".join(lines)


def get_series(series_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve a series by ID from Supabase or fallback in-memory store."""
    client = get_supabase_client()
    if client:
        try:
            res = client.table("series").select("*").eq("id", series_id).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
        except Exception as e:
            logger.warning("Supabase get series failed: %s (checking in-memory store)", e)

    return IN_MEMORY_SERIES.get(series_id)


def list_user_series(user_id: Optional[str]) -> List[Dict[str, Any]]:
    """List all series belonging to a user ordered by updated_at descending."""
    client = get_supabase_client()
    if client and user_id:
        try:
            res = (
                client.table("series")
                .select("*")
                .eq("user_id", user_id)
                .order("updated_at", desc=True)
                .execute()
            )
            if res.data is not None:
                return res.data
        except Exception as e:
            logger.warning("Supabase list series failed: %s", e)

    # Fallback in-memory filter
    if user_id:
        return [s for s in IN_MEMORY_SERIES.values() if s.get("user_id") == user_id]
    return list(IN_MEMORY_SERIES.values())


def create_series(
    user_id: str,
    title: str,
    genre: Optional[str] = None,
    tone: Optional[str] = None,
    premise: Optional[str] = None,
    world_rules: Optional[List[str]] = None,
    recurring_characters: Optional[List[Any]] = None,
) -> Dict[str, Any]:
    """Create a new series record with an initialized Show Bible."""
    series_id = str(uuid.uuid4())
    now_str = get_iso_now()

    bible_json = {
        "title": title,
        "genre": genre or "General",
        "tone": tone or "Engaging",
        "premise": premise or f"A serialized content universe about {title}",
        "world_rules": world_rules or [],
        "recurring_characters": recurring_characters or [],
        "episode_summaries": [],
    }

    record = {
        "id": series_id,
        "user_id": user_id,
        "title": title,
        "genre": genre,
        "tone": tone,
        "bible_json": bible_json,
        "episode_count": 0,
        "created_at": now_str,
        "updated_at": now_str,
    }

    client = get_supabase_client()
    if client:
        try:
            res = client.table("series").insert(record).execute()
            if res.data and len(res.data) > 0:
                logger.info("Created series in Supabase: %s (%s)", series_id, title)
                return res.data[0]
        except Exception as e:
            logger.warning("Supabase insert series failed (using memory store): %s", e)

    IN_MEMORY_SERIES[series_id] = record
    return record


def update_series_bible(
    series_id: str,
    new_episode_summary: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Appends an episode recap to the Show Bible and increments episode_count."""
    series = get_series(series_id)
    if not series:
        logger.warning("Series %s not found for bible update.", series_id)
        return None

    bible = series.get("bible_json") or {}
    episode_summaries = bible.get("episode_summaries", [])
    episode_summaries.append(new_episode_summary)
    bible["episode_summaries"] = episode_summaries

    new_count = int(series.get("episode_count") or 0) + 1
    now_str = get_iso_now()

    updates = {
        "bible_json": bible,
        "episode_count": new_count,
        "updated_at": now_str,
    }

    client = get_supabase_client()
    if client:
        try:
            res = client.table("series").update(updates).eq("id", series_id).execute()
            if res.data and len(res.data) > 0:
                logger.info("Updated series bible for %s (ep count: %d)", series_id, new_count)
                return res.data[0]
        except Exception as e:
            logger.warning("Supabase update series bible failed: %s", e)

    series.update(updates)
    IN_MEMORY_SERIES[series_id] = series
    return series


def delete_series(series_id: str) -> bool:
    """Deletes a series record (episodes will set series_id to NULL)."""
    client = get_supabase_client()
    if client:
        try:
            client.table("series").delete().eq("id", series_id).execute()
            logger.info("Deleted series from Supabase: %s", series_id)
        except Exception as e:
            logger.warning("Supabase delete series failed: %s", e)

    if series_id in IN_MEMORY_SERIES:
        del IN_MEMORY_SERIES[series_id]

    return True
