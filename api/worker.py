"""Background worker service executing the end-to-end video generation pipeline asynchronously."""
import asyncio
import logging
from pathlib import Path
import time
import traceback
from typing import Any, List, Optional

from api.db import get_social_accounts, update_video_job_record
from api.schemas import VideoJobStatus
from api.services.github_dispatcher import (
    dispatch_github_render_job,
    is_github_dispatch_enabled,
)
from engine.config import OUTPUT_DIR, TEMP_DIR
from engine.media_downloader import fetch_script_media
from engine.pipeline import generate_animated_story_video
from engine.script_generator import generate_script
from engine.tts_engine import DEFAULT_VOICE, synthesize_script
from engine.video_renderer import render_video

logger = logging.getLogger("postmatic.worker")


def execute_video_pipeline_job(
    job_id: str,
    topic: str,
    target_duration: int = 25,
    voice: Optional[str] = None,
    user_id: Optional[str] = None,
    publish_youtube: bool = False,
    privacy: str = "public",
    video_format: str = "short",
    target_platform: str = "youtube",
    mode: str = "shorts",
    story_style: str = "anime",
    characters: Optional[List[Any]] = None,
) -> None:
    """Execute the end-to-end 5-stage video pipeline in a background task.

    If GitHub Actions cloud compute is configured (via GITHUB_PAT and GITHUB_REPO),
    offloads heavy FFmpeg rendering to GitHub Actions' free 7 GB RAM runner.
    Otherwise, executes the rendering locally with graceful fallback.
    """
    selected_voice = voice or DEFAULT_VOICE
    logger.info(
        "Starting background video generation job '%s' for topic '%s' (format: %s, platform: %s)",
        job_id,
        topic,
        video_format,
        target_platform,
    )

    # 1. Check if GitHub Actions Cloud Compute offloading is enabled
    if is_github_dispatch_enabled():
        logger.info("[%s] Cloud compute offload active. Dispatching to GitHub Actions...", job_id)
        update_video_job_record(
            job_id=job_id,
            status=VideoJobStatus.SCRIPTING,
            progress_pct=10,
        )
        try:
            asyncio.run(
                dispatch_github_render_job(
                    job_id=job_id,
                    topic=topic,
                    duration=target_duration,
                    voice=selected_voice,
                    user_id=user_id,
                    publish_youtube=publish_youtube,
                    privacy=privacy,
                    video_format=video_format,
                    target_platform=target_platform,
                )
            )
            logger.info(
                "[%s] Successfully dispatched to GitHub Actions. Cloud runner will execute FFmpeg and update Supabase.",
                job_id,
            )
            return
        except Exception as dispatch_err:
            logger.warning(
                "[%s] GitHub dispatch failed: %s. Falling back to local execution...",
                job_id,
                dispatch_err,
            )

    # 2. Local Fallback Execution
    try:
        if mode == "story":
            logger.info("[%s] Executing Animated Story Pipeline (style: %s)...", job_id, story_style)

            def progress_cb(status_name: str, pct: int, payload: Optional[dict] = None):
                status_enum = {
                    "scripting": VideoJobStatus.SCRIPTING,
                    "synthesizing": VideoJobStatus.SYNTHESIZING,
                    "foley_mixing": VideoJobStatus.SYNTHESIZING,
                    "sourcing_visuals": VideoJobStatus.SOURCING_MEDIA,
                    "rendering": VideoJobStatus.RENDERING,
                }.get(status_name, VideoJobStatus.RENDERING)
                update_video_job_record(
                    job_id=job_id,
                    status=status_enum,
                    progress_pct=pct,
                    script_data=payload if status_name == "scripting" else None,
                )

            dest_output_path = OUTPUT_DIR / f"video_{job_id}.mp4"
            story_result = generate_animated_story_video(
                topic=topic,
                style=story_style,
                target_duration=target_duration,
                custom_characters=characters,
                output_path=dest_output_path,
                progress_callback=progress_cb,
            )
            final_video_path = story_result.video_path
            file_size = final_video_path.stat().st_size
            video_url = f"/output/video_{job_id}.mp4"

            try:
                from api.services.storage import upload_video_to_supabase, prune_expired_storage_videos
                storage_url = upload_video_to_supabase(final_video_path, job_id=job_id)
                if storage_url and not video_url.startswith("http"):
                    video_url = storage_url
                prune_expired_storage_videos(max_age_days=7, max_videos=20)
            except Exception as storage_err:
                logger.warning("[%s] Storage upload fallback: %s", job_id, storage_err)

            update_video_job_record(
                job_id=job_id,
                status=VideoJobStatus.COMPLETED,
                progress_pct=100,
                video_url=video_url,
                file_size_bytes=file_size,
            )
            return

        # STAGE 1: Scripting (15%)
        update_video_job_record(
            job_id=job_id,
            status=VideoJobStatus.SCRIPTING,
            progress_pct=15,
        )
        logger.info("[%s] Stage 1/4: Generating script...", job_id)
        script = generate_script(
            topic=topic,
            target_duration=target_duration,
        )
        script_dict = script.model_dump()
        update_video_job_record(
            job_id=job_id,
            status=VideoJobStatus.SCRIPTING,
            progress_pct=25,
            script_data=script_dict,
        )

        # STAGE 2: Voice Synthesis & ASS Subtitles (35%)
        update_video_job_record(
            job_id=job_id,
            status=VideoJobStatus.SYNTHESIZING,
            progress_pct=35,
        )
        logger.info("[%s] Stage 2/4: Synthesizing voiceover with '%s'...", job_id, selected_voice)
        tts_dir = TEMP_DIR / "tts" / job_id
        aspect_ratio = "16:9" if video_format == "long" else "9:16"
        tts_result = synthesize_script(
            script=script,
            voice=selected_voice,
            output_dir=tts_dir,
            aspect_ratio=aspect_ratio,
        )
        update_video_job_record(
            job_id=job_id,
            status=VideoJobStatus.SYNTHESIZING,
            progress_pct=50,
        )

        # Map scene durations
        scene_durations = {
            s.scene_id: s.duration for s in tts_result.scene_results
        }

        # STAGE 3: Sourcing HD Media (60%)
        update_video_job_record(
            job_id=job_id,
            status=VideoJobStatus.SOURCING_MEDIA,
            progress_pct=60,
        )
        logger.info("[%s] Stage 3/4: Sourcing media (format: %s)...", job_id, video_format)
        media_dir = TEMP_DIR / "media" / job_id
        downloaded_videos = fetch_script_media(
            script=script,
            scene_durations=scene_durations,
            output_dir=media_dir,
            video_format=video_format,
        )
        update_video_job_record(
            job_id=job_id,
            status=VideoJobStatus.SOURCING_MEDIA,
            progress_pct=75,
        )

        # STAGE 4: FFmpeg Video Assembly & Subtitle Burning (85%)
        update_video_job_record(
            job_id=job_id,
            status=VideoJobStatus.RENDERING,
            progress_pct=85,
        )
        output_filename = f"video_{job_id}.mp4"
        dest_output_path = OUTPUT_DIR / output_filename
        render_work_dir = TEMP_DIR / "render" / job_id

        logger.info("[%s] Stage 4/4: Assembling final %s video and burning subtitles...", job_id, video_format)
        final_video_path = render_video(
            downloaded_videos=downloaded_videos,
            tts_result=tts_result,
            output_path=dest_output_path,
            render_dir=render_work_dir,
            video_format=video_format,
        )

        file_size = final_video_path.stat().st_size
        video_url = f"/output/{output_filename}"

        # OPTIONAL: Direct Social Publishing (YouTube)
        if publish_youtube and target_platform == "youtube":
            is_short = (video_format == "short")
            logger.info("[%s] Auto-publishing rendered video to YouTube (%s)...", job_id, "Shorts" if is_short else "Video")
            try:
                from api.services.token_manager import ensure_valid_access_token
                from engine.social.youtube_uploader import upload_video_to_youtube

                accounts = get_social_accounts(user_id=user_id)
                yt_acc = next((a for a in accounts if a.get("platform") == "youtube"), None)
                if yt_acc:
                    access_token, was_refreshed = asyncio.run(ensure_valid_access_token(yt_acc))
                    tags_str = ' #'.join(script.tags) if script.tags else ""
                    if is_short:
                        desc = f"{script.description}\n\n#Shorts #{tags_str}"
                    else:
                        desc = f"{script.description}\n\n#{tags_str}" if tags_str else script.description

                    upload_res = upload_video_to_youtube(
                        video_file_path=final_video_path,
                        title=script.title,
                        description=desc,
                        tags=script.tags,
                        access_token=access_token,
                        privacy_status=privacy,
                        video_format=video_format,
                    )
                    video_url = upload_res.youtube_url
                    logger.info("[%s] Published to YouTube: %s", job_id, video_url)
                else:
                    logger.warning("[%s] No connected YouTube account found for user '%s'", job_id, user_id)
            except Exception as pub_exc:
                logger.error("[%s] YouTube upload failed: %s", job_id, pub_exc)

        # Persistent storage upload to Supabase CDN
        try:
            from api.services.storage import upload_video_to_supabase, prune_expired_storage_videos
            storage_url = upload_video_to_supabase(final_video_path, job_id=job_id)
            if storage_url and not video_url.startswith("http"):
                video_url = storage_url
            prune_expired_storage_videos(max_age_days=7, max_videos=20)
        except Exception as storage_err:
            logger.warning("[%s] Storage upload/prune fallback: %s", job_id, storage_err)

        # STAGE 5: Completed (100%)
        update_video_job_record(
            job_id=job_id,
            status=VideoJobStatus.COMPLETED,
            progress_pct=100,
            video_url=video_url,
            duration_seconds=tts_result.total_duration,
            file_size_bytes=file_size,
        )

        logger.info(
            "[%s] SUCCESS! Video generated at %s (Size: %.2f MB, Duration: %.2fs)",
            job_id,
            video_url,
            file_size / (1024 * 1024),
            tts_result.total_duration,
        )

    except Exception as e:
        err_msg = str(e)
        logger.error("[%s] FAILED: %s\n%s", job_id, err_msg, traceback.format_exc())
        update_video_job_record(
            job_id=job_id,
            status=VideoJobStatus.FAILED,
            error_message=err_msg,
        )
