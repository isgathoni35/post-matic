"""Series Ecosystem Engine: Manages Show Bibles, continuity prompts, and series state."""

import json
import logging
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional
import uuid

from api.db import get_supabase_client
from engine.script_generator import VIRAL_NICHE_CONFIGS

logger = logging.getLogger(__name__)

# Fallback in-memory store for series when Supabase is unreachable or in tests
IN_MEMORY_SERIES: Dict[str, Dict[str, Any]] = {}


def get_iso_now() -> str:
    """Get current UTC time in ISO 8601 string format."""
    return datetime.now(timezone.utc).isoformat()


def calculate_next_post_at(
    post_frequency_per_day: int = 1,
    preferred_time_utc: str = "18:00",
    from_time: Optional[datetime] = None,
) -> str:
    """Calculates the subsequent UTC posting timestamp for a series based on daily frequency."""
    base = from_time or datetime.now(timezone.utc)
    if base.tzinfo is None:
        base = base.replace(tzinfo=timezone.utc)

    try:
        parts = preferred_time_utc.split(":")
        hour = int(parts[0])
        minute = int(parts[1]) if len(parts) > 1 else 0
    except Exception:
        hour, minute = 18, 0

    if post_frequency_per_day <= 1:
        # 1 post per day: Next scheduled time at preferred_time_utc
        scheduled = base.replace(hour=hour, minute=minute, second=0, microsecond=0)
        if scheduled <= base:
            scheduled += timedelta(days=1)
        return scheduled.isoformat()
    elif post_frequency_per_day == 2:
        # 2 posts per day: 12 hours from previous post/current time
        scheduled = base + timedelta(hours=12)
        return scheduled.isoformat()
    else:
        # 3+ posts per day: 8 hours from previous post/current time
        scheduled = base + timedelta(hours=8)
        return scheduled.isoformat()


def calculate_initial_next_post_at(
    preferred_time_utc: str = "18:00",
    post_frequency_per_day: int = 1,
) -> str:
    """Calculates the first upcoming UTC posting timestamp for a series."""
    now = datetime.now(timezone.utc)
    try:
        parts = preferred_time_utc.split(":")
        hour = int(parts[0])
        minute = int(parts[1]) if len(parts) > 1 else 0
    except Exception:
        hour, minute = 18, 0

    scheduled = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
    if scheduled <= now:
        if post_frequency_per_day >= 3:
            scheduled = now + timedelta(hours=8)
        elif post_frequency_per_day == 2:
            scheduled = now + timedelta(hours=12)
        else:
            scheduled += timedelta(days=1)
    return scheduled.isoformat()


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

    niche_key = bible_json.get("niche")
    if niche_key and niche_key in VIRAL_NICHE_CONFIGS:
        niche_cfg = VIRAL_NICHE_CONFIGS[niche_key]
        lines.append(f"Viral Niche: {niche_cfg['name']}")
        lines.append(f"Niche Hook Formula: {niche_cfg['hook_formula']}")
        lines.append(f"Retention & Pacing Rules: {niche_cfg['tone_rules']}")

    if bible_json.get("genre"):
        lines.append(f"Genre: {bible_json['genre']}")

    if bible_json.get("tone"):
        lines.append(f"Tone: {bible_json['tone']}")

    if bible_json.get("art_style"):
        lines.append(f"Visual Art Style: {bible_json['art_style']}")

    if bible_json.get("voice"):
        lines.append(f"Primary Narrator Voice: {bible_json['voice']}")

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
    niche: Optional[str] = "scary_stories",
    art_style: Optional[str] = "cinematic_dark",
    voice: Optional[str] = "en-US-BrianMultilingualNeural",
    music_track: Optional[str] = "cinematic_mystery",
    subtitle_style: Optional[str] = "hormozi_yellow",
    autopilot_enabled: bool = False,
    post_frequency_per_day: int = 1,
    preferred_time_utc: str = "18:00",
    target_platforms: Optional[List[str]] = None,
    require_approval: bool = False,
) -> Dict[str, Any]:
    """Create a new series record with an initialized Show Bible and viral niche configuration."""
    series_id = str(uuid.uuid4())
    now_str = get_iso_now()

    platforms = target_platforms if target_platforms is not None else ["youtube"]
    next_post = calculate_initial_next_post_at(preferred_time_utc, post_frequency_per_day) if autopilot_enabled else None

    bible_json = {
        "title": title,
        "genre": genre or "General",
        "tone": tone or "Engaging",
        "premise": premise or f"A serialized content universe about {title}",
        "world_rules": world_rules or [],
        "recurring_characters": recurring_characters or [],
        "episode_summaries": [],
        "niche": niche or "scary_stories",
        "art_style": art_style or "cinematic_dark",
        "voice": voice or "en-US-BrianMultilingualNeural",
        "music_track": music_track or "cinematic_mystery",
        "subtitle_style": subtitle_style or "hormozi_yellow",
        "autopilot_enabled": autopilot_enabled,
        "post_frequency_per_day": post_frequency_per_day,
        "preferred_time_utc": preferred_time_utc,
        "target_platforms": platforms,
        "require_approval": require_approval,
    }

    record = {
        "id": series_id,
        "user_id": user_id,
        "title": title,
        "genre": genre,
        "tone": tone,
        "niche": niche or "scary_stories",
        "art_style": art_style or "cinematic_dark",
        "voice": voice or "en-US-BrianMultilingualNeural",
        "music_track": music_track or "cinematic_mystery",
        "subtitle_style": subtitle_style or "hormozi_yellow",
        "autopilot_enabled": autopilot_enabled,
        "post_frequency_per_day": post_frequency_per_day,
        "preferred_time_utc": preferred_time_utc,
        "target_platforms": platforms,
        "require_approval": require_approval,
        "next_post_at": next_post,
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
            # Try inserting basic schema if extra columns aren't migrated in DB yet
            try:
                basic_record = {
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
                res = client.table("series").insert(basic_record).execute()
                if res.data and len(res.data) > 0:
                    created_row = res.data[0]
                    # Augment with memory fields
                    created_row.update(record)
                    return created_row
            except Exception as e2:
                logger.warning("Basic Supabase insert fallback also failed: %s", e2)

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


def generate_next_episode_concept(
    series: Dict[str, Any],
    next_episode_num: int,
) -> Dict[str, str]:
    """Uses Gemini API to synthesize the next episode's title and hook topic based on the Show Bible.

    Falls back gracefully to procedural generation if Gemini is offline or unconfigured.
    """
    bible = series.get("bible_json") or {}
    title = series.get("title") or bible.get("title", "Untitled Series")
    niche_key = series.get("niche") or bible.get("niche", "scary_stories")
    niche_cfg = VIRAL_NICHE_CONFIGS.get(niche_key, {})
    niche_name = niche_cfg.get("name", "Story")

    # Procedural fallback concept
    fallback_concept = {
        "title": f"Episode {next_episode_num}: The Mystery Deepens",
        "topic": f"{title} (Episode {next_episode_num}): A captivating continuation in the {niche_name} universe. Advance the overarching mystery with high-retention storytelling.",
    }

    try:
        from engine.config import GEMINI_API_KEY, GEMINI_MODELS
        if not GEMINI_API_KEY:
            return fallback_concept

        from google import genai
        from google.genai import types

        client = genai.Client(api_key=GEMINI_API_KEY)
        context_prompt = build_series_context_prompt(bible, next_episode_num=next_episode_num)

        instructions = (
            f"You are the head writer for '{title}', a serialized viral short-form video series.\n"
            f"{context_prompt}\n\n"
            f"Generate Episode {next_episode_num}. Return a JSON object with two fields:\n"
            f"- 'title': A short, punchy episode title (e.g. 'Episode {next_episode_num}: Whispers in the Vault')\n"
            f"- 'topic': A detailed, hook-driven prompt (2-3 sentences) suitable for a short-form video script generator. "
            f"It must open with a curiosity hook, advance the overarching plot or lore, and end with tension."
        )

        for model_name in GEMINI_MODELS:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=instructions,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.7,
                    ),
                )
                if response.text:
                    parsed = json.loads(response.text)
                    if isinstance(parsed, dict) and "topic" in parsed:
                        ep_title = parsed.get("title") or f"Episode {next_episode_num}"
                        return {"title": ep_title, "topic": parsed["topic"]}
            except Exception as m_err:
                logger.debug("Gemini model %s concept generation attempt failed: %s", model_name, m_err)
                continue
    except Exception as e:
        logger.warning("Error generating next episode concept via Gemini: %s. Using fallback.", e)

    return fallback_concept


def dispatch_due_autopilot_series(
    background_tasks: Optional[Any] = None,
) -> Dict[str, Any]:
    """Hourly worker dispatcher: Finds all autopilot-enabled series due for posting,
    generates the next episode topic, creates video job records, and enqueues generation.
    """
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    client = get_supabase_client()

    evaluated_series: Dict[str, Dict[str, Any]] = {}

    # 1. Fetch from Supabase
    if client:
        try:
            res = (
                client.table("series")
                .select("*")
                .eq("autopilot_enabled", True)
                .execute()
            )
            if res.data:
                for row in res.data:
                    evaluated_series[row["id"]] = row
        except Exception as e:
            logger.warning("Failed to query autopilot series from Supabase: %s", e)

    # 2. Also check in-memory store (for testing / fallback)
    for s_id, s_data in IN_MEMORY_SERIES.items():
        bible = s_data.get("bible_json") or {}
        is_auto = bool(s_data.get("autopilot_enabled", bible.get("autopilot_enabled", False)))
        if is_auto:
            evaluated_series[s_id] = s_data

    checked_count = len(evaluated_series)
    dispatched_jobs: List[Dict[str, Any]] = []

    for series_id, series in evaluated_series.items():
        bible = series.get("bible_json") or {}
        next_post_str = series.get("next_post_at") or bible.get("next_post_at")

        is_due = False
        if not next_post_str:
            is_due = True
        else:
            try:
                next_post_dt = datetime.fromisoformat(next_post_str.replace("Z", "+00:00"))
                if next_post_dt.tzinfo is None:
                    next_post_dt = next_post_dt.replace(tzinfo=timezone.utc)
                if next_post_dt <= now:
                    is_due = True
            except Exception as dt_err:
                logger.warning("Could not parse next_post_at '%s': %s", next_post_str, dt_err)
                is_due = True

        if not is_due:
            continue

        # Series is due for a new episode
        current_ep = int(series.get("episode_count") or bible.get("episode_count") or 0)
        next_ep = current_ep + 1

        concept = generate_next_episode_concept(series, next_ep)
        topic = concept["topic"]
        job_id = str(uuid.uuid4())
        user_id = series.get("user_id")

        target_platforms = series.get("target_platforms") or bible.get("target_platforms") or ["youtube"]
        require_approval = bool(series.get("require_approval", bible.get("require_approval", False)))
        publish_youtube = ("youtube" in target_platforms) and (not require_approval)

        niche = series.get("niche") or bible.get("niche", "scary_stories")
        voice = series.get("voice") or bible.get("voice", "en-US-BrianMultilingualNeural")
        music_track = series.get("music_track") or bible.get("music_track", "cinematic_mystery")
        subtitle_style = series.get("subtitle_style") or bible.get("subtitle_style", "hormozi_yellow")
        story_style = series.get("art_style") or bible.get("art_style", "anime")
        mode = "story" if niche in ("stickman", "anime_lore") or "story" in str(series.get("genre", "")).lower() else "shorts"

        # Create video job record
        from api.db import create_video_job_record
        from api.worker import execute_video_pipeline_job

        create_video_job_record(
            job_id=job_id,
            topic=topic,
            target_duration=25,
            voice=voice,
            user_id=user_id,
            video_format="short",
            target_platform=target_platforms[0] if target_platforms else "youtube",
            series_id=series_id,
            episode_number=next_ep,
        )

        # Enqueue or execute pipeline job
        if background_tasks is not None:
            background_tasks.add_task(
                execute_video_pipeline_job,
                job_id=job_id,
                topic=topic,
                target_duration=25,
                voice=voice,
                user_id=user_id,
                publish_youtube=publish_youtube,
                privacy="public",
                video_format="short",
                target_platform=target_platforms[0] if target_platforms else "youtube",
                mode=mode,
                story_style=story_style,
                characters=series.get("recurring_characters") or bible.get("recurring_characters"),
                series_id=series_id,
                episode_number=next_ep,
                music_track=music_track,
                subtitle_style=subtitle_style,
            )
        else:
            import threading
            worker_thread = threading.Thread(
                target=execute_video_pipeline_job,
                kwargs={
                    "job_id": job_id,
                    "topic": topic,
                    "target_duration": 25,
                    "voice": voice,
                    "user_id": user_id,
                    "publish_youtube": publish_youtube,
                    "privacy": "public",
                    "video_format": "short",
                    "target_platform": target_platforms[0] if target_platforms else "youtube",
                    "mode": mode,
                    "story_style": story_style,
                    "characters": series.get("recurring_characters") or bible.get("recurring_characters"),
                    "series_id": series_id,
                    "episode_number": next_ep,
                    "music_track": music_track,
                    "subtitle_style": subtitle_style,
                },
                daemon=True,
            )
            worker_thread.start()

        # Advance next_post_at and last_posted_at
        freq = int(series.get("post_frequency_per_day") or bible.get("post_frequency_per_day") or 1)
        pref_time = str(series.get("preferred_time_utc") or bible.get("preferred_time_utc") or "18:00")
        next_post_at = calculate_next_post_at(freq, pref_time, from_time=now)
        last_posted_at = now_iso

        series_updates = {
            "next_post_at": next_post_at,
            "last_posted_at": last_posted_at,
            "updated_at": last_posted_at,
        }
        bible["next_post_at"] = next_post_at
        bible["last_posted_at"] = last_posted_at
        series_updates["bible_json"] = bible

        # Update in Supabase
        if client:
            try:
                client.table("series").update(series_updates).eq("id", series_id).execute()
            except Exception as up_err:
                logger.warning("Failed to update series %s next_post_at in Supabase: %s", series_id, up_err)
                try:
                    client.table("series").update({"bible_json": bible, "updated_at": last_posted_at}).eq("id", series_id).execute()
                except Exception as up_err2:
                    logger.warning("Fallback bible update also failed: %s", up_err2)

        # Update in memory
        series.update(series_updates)
        IN_MEMORY_SERIES[series_id] = series

        dispatched_jobs.append({
            "series_id": series_id,
            "series_title": series.get("title") or bible.get("title", "Untitled"),
            "job_id": job_id,
            "episode_number": next_ep,
            "topic": topic,
            "publish_youtube": publish_youtube,
            "next_post_at": next_post_at,
            "last_posted_at": last_posted_at,
        })
        logger.info(
            "Dispatched Autopilot job %s for series '%s' (Episode %d, next post: %s)",
            job_id,
            series.get("title"),
            next_ep,
            next_post_at,
        )

    return {
        "checked_count": checked_count,
        "dispatched_count": len(dispatched_jobs),
        "dispatched_jobs": dispatched_jobs,
    }


def trigger_series_autopilot_now(
    series_id: str,
    background_tasks: Optional[Any] = None,
) -> Dict[str, Any]:
    """Force-triggers immediate generation of the next episode for a specific series,
    bypassing the next_post_at schedule, updates the Show Bible, and advances the schedule.
    """
    series = get_series(series_id)
    if not series:
        raise ValueError(f"Series '{series_id}' not found.")

    bible = series.get("bible_json") or {}
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()

    current_ep = int(series.get("episode_count") or bible.get("episode_count") or 0)
    next_ep = current_ep + 1

    concept = generate_next_episode_concept(series, next_ep)
    topic = concept["topic"]
    job_id = str(uuid.uuid4())
    user_id = series.get("user_id")

    target_platforms = series.get("target_platforms") or bible.get("target_platforms") or ["youtube"]
    require_approval = bool(series.get("require_approval", bible.get("require_approval", False)))
    publish_youtube = ("youtube" in target_platforms) and (not require_approval)

    niche = series.get("niche") or bible.get("niche", "scary_stories")
    voice = series.get("voice") or bible.get("voice", "en-US-BrianMultilingualNeural")
    music_track = series.get("music_track") or bible.get("music_track", "cinematic_mystery")
    subtitle_style = series.get("subtitle_style") or bible.get("subtitle_style", "hormozi_yellow")
    story_style = series.get("art_style") or bible.get("art_style", "anime")
    mode = "story" if niche in ("stickman", "anime_lore") or "story" in str(series.get("genre", "")).lower() else "shorts"

    from api.db import create_video_job_record
    from api.worker import execute_video_pipeline_job

    create_video_job_record(
        job_id=job_id,
        topic=topic,
        target_duration=25,
        voice=voice,
        user_id=user_id,
        video_format="short",
        target_platform=target_platforms[0] if target_platforms else "youtube",
        series_id=series_id,
        episode_number=next_ep,
    )

    if background_tasks is not None:
        background_tasks.add_task(
            execute_video_pipeline_job,
            job_id=job_id,
            topic=topic,
            target_duration=25,
            voice=voice,
            user_id=user_id,
            publish_youtube=publish_youtube,
            privacy="public",
            video_format="short",
            target_platform=target_platforms[0] if target_platforms else "youtube",
            mode=mode,
            story_style=story_style,
            characters=series.get("recurring_characters") or bible.get("recurring_characters"),
            series_id=series_id,
            episode_number=next_ep,
            music_track=music_track,
            subtitle_style=subtitle_style,
        )
    else:
        import threading
        worker_thread = threading.Thread(
            target=execute_video_pipeline_job,
            kwargs={
                "job_id": job_id,
                "topic": topic,
                "target_duration": 25,
                "voice": voice,
                "user_id": user_id,
                "publish_youtube": publish_youtube,
                "privacy": "public",
                "video_format": "short",
                "target_platform": target_platforms[0] if target_platforms else "youtube",
                "mode": mode,
                "story_style": story_style,
                "characters": series.get("recurring_characters") or bible.get("recurring_characters"),
                "series_id": series_id,
                "episode_number": next_ep,
                "music_track": music_track,
                "subtitle_style": subtitle_style,
            },
            daemon=True,
        )
        worker_thread.start()

    freq = int(series.get("post_frequency_per_day") or bible.get("post_frequency_per_day") or 1)
    pref_time = str(series.get("preferred_time_utc") or bible.get("preferred_time_utc") or "18:00")
    next_post_at = calculate_next_post_at(freq, pref_time, from_time=now)
    last_posted_at = now_iso

    series_updates = {
        "next_post_at": next_post_at,
        "last_posted_at": last_posted_at,
        "updated_at": last_posted_at,
    }
    bible["next_post_at"] = next_post_at
    bible["last_posted_at"] = last_posted_at
    series_updates["bible_json"] = bible

    client = get_supabase_client()
    if client:
        try:
            client.table("series").update(series_updates).eq("id", series_id).execute()
        except Exception as up_err:
            logger.warning("Failed to update series %s next_post_at in Supabase: %s", series_id, up_err)
            try:
                client.table("series").update({"bible_json": bible, "updated_at": last_posted_at}).eq("id", series_id).execute()
            except Exception as up_err2:
                logger.warning("Fallback bible update also failed: %s", up_err2)

    series.update(series_updates)
    IN_MEMORY_SERIES[series_id] = series

    logger.info("Manual override triggered Autopilot job %s for series '%s' (Ep %d)", job_id, series.get("title"), next_ep)
    return {
        "series_id": series_id,
        "series_title": series.get("title") or bible.get("title", "Untitled"),
        "job_id": job_id,
        "episode_number": next_ep,
        "topic": topic,
        "publish_youtube": publish_youtube,
        "next_post_at": next_post_at,
        "last_posted_at": last_posted_at,
    }


def toggle_series_autopilot(series_id: str, enabled: bool) -> Dict[str, Any]:
    """Toggles autopilot status for a series and updates next_post_at."""
    series = get_series(series_id)
    if not series:
        raise ValueError(f"Series '{series_id}' not found.")

    bible = series.get("bible_json") or {}
    now_iso = get_iso_now()

    pref_time = str(series.get("preferred_time_utc") or bible.get("preferred_time_utc") or "18:00")
    freq = int(series.get("post_frequency_per_day") or bible.get("post_frequency_per_day") or 1)
    next_post = calculate_initial_next_post_at(pref_time, freq) if enabled else None

    series_updates = {
        "autopilot_enabled": enabled,
        "next_post_at": next_post,
        "updated_at": now_iso,
    }
    bible["autopilot_enabled"] = enabled
    bible["next_post_at"] = next_post
    series_updates["bible_json"] = bible

    client = get_supabase_client()
    if client:
        try:
            client.table("series").update(series_updates).eq("id", series_id).execute()
        except Exception as up_err:
            logger.warning("Failed to toggle autopilot in Supabase for series %s: %s", series_id, up_err)
            try:
                client.table("series").update({"bible_json": bible, "updated_at": now_iso}).eq("id", series_id).execute()
            except Exception as up_err2:
                logger.warning("Fallback bible update also failed: %s", up_err2)

    series.update(series_updates)
    IN_MEMORY_SERIES[series_id] = series
    return series


