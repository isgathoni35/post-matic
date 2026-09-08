#!/usr/bin/env python3
"""Cloud rendering and publishing worker entrypoint for GitHub Actions or CLI execution."""
import argparse
import asyncio
import logging
from pathlib import Path
import sys
from typing import Optional

# Ensure project root is on sys.path
PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from api.db import get_social_accounts, update_video_job_record
from api.schemas import VideoJobStatus
from api.services.storage import upload_video_to_supabase, prune_expired_storage_videos
from api.services.token_manager import ensure_valid_access_token
from engine.pipeline import generate_faceless_video
from engine.social.youtube_uploader import upload_video_to_youtube
from engine.tts_engine import DEFAULT_VOICE


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("postmatic.cloud_runner")


def main():
    parser = argparse.ArgumentParser(
        description="PostMatic: Cloud Video Rendering and Social Publishing Runner",
    )
    parser.add_argument("--topic", "-t", type=str, required=True, help="Video prompt/topic")
    parser.add_argument("--duration", "-d", type=int, default=25, help="Duration in seconds")
    parser.add_argument("--voice", "-v", type=str, default=DEFAULT_VOICE, help="Neural voice name")
    parser.add_argument("--job-id", "-j", type=str, default=None, help="Associated Supabase video_job UUID")
    parser.add_argument("--user-id", "-u", type=str, default=None, help="User ID owning the job")
    parser.add_argument("--publish-youtube", action="store_true", help="Publish directly to YouTube Shorts")
    parser.add_argument("--privacy", type=str, default="public", choices=["public", "unlisted", "private"], help="YouTube privacy status")
    parser.add_argument("--format", "--video-format", dest="video_format", type=str, default="short", choices=["short", "long"], help="Video format: short (9:16) or long (16:9)")
    parser.add_argument("--platform", type=str, default="youtube", choices=["youtube", "tiktok", "instagram"], help="Target social platform")
    parser.add_argument("--access-token", type=str, default=None, help="Direct access token override")

    args = parser.parse_args()

    job_id = args.job_id
    if job_id:
        update_video_job_record(
            job_id=job_id,
            status=VideoJobStatus.SCRIPTING,
            progress_pct=10,
        )

    def on_progress(status_str: str, pct: int, script_data: Optional[dict] = None):
        if job_id:
            try:
                st = VideoJobStatus(status_str)
                update_video_job_record(
                    job_id=job_id,
                    status=st,
                    progress_pct=pct,
                    script_data=script_data,
                )
                logger.info("[%s] Real-time milestone updated: status=%s, progress=%d%%", job_id, status_str, pct)
            except Exception as e:
                logger.warning("[%s] Failed updating progress milestone: %s", job_id, e)

    try:
        logger.info("Starting cloud generation for topic: '%s' (format: %s)...", args.topic, args.video_format)
        result = generate_faceless_video(
            topic=args.topic,
            target_duration=args.duration,
            voice=args.voice,
            video_format=args.video_format,
            progress_callback=on_progress,
        )

        logger.info("Video generation completed: %s (%d bytes)", result.video_path, result.file_size_bytes)

        youtube_url = None
        if args.publish_youtube and args.platform == "youtube":
            is_short = (args.video_format == "short")
            logger.info("Publishing video to YouTube (%s)...", "Shorts" if is_short else "Standard Video")
            access_token = args.access_token

            if not access_token:
                # Find connected YouTube account from database
                accounts = get_social_accounts(user_id=args.user_id)
                yt_acc = next((a for a in accounts if a.get("platform") == "youtube"), None)
                if not yt_acc:
                    raise RuntimeError(
                        f"No connected YouTube account found for user '{args.user_id}'. "
                        "Please link your YouTube account first via the Studio Dashboard."
                    )

                logger.info("Verifying access token expiration for account '%s'...", yt_acc.get("id"))
                access_token, was_refreshed = asyncio.run(ensure_valid_access_token(yt_acc))
                if was_refreshed:
                    logger.info("Access token was successfully refreshed prior to upload.")

            tags_formatted = ' #'.join(result.script.tags) if result.script.tags else ""
            if is_short:
                desc = f"{result.script.description}\n\n#Shorts #{tags_formatted}"
            else:
                desc = f"{result.script.description}\n\n#{tags_formatted}" if tags_formatted else result.script.description

            upload_res = upload_video_to_youtube(
                video_file_path=result.video_path,
                title=result.script.title,
                description=desc,
                tags=result.script.tags,
                access_token=access_token,
                privacy_status=args.privacy,
                video_format=args.video_format,
            )
            youtube_url = upload_res.youtube_url
            logger.info("Published YouTube URL: %s", youtube_url)

        # Upload to persistent Supabase Storage CDN
        if job_id:
            update_video_job_record(job_id=job_id, status=VideoJobStatus.RENDERING, progress_pct=95)

        public_storage_url = None
        try:
            public_storage_url = upload_video_to_supabase(result.video_path, job_id=job_id or "latest")
            if public_storage_url:
                logger.info("Video hosted on Supabase Storage CDN: %s", public_storage_url)
            # Prune videos older than 7 days or beyond 20 items to guarantee Zero-OpEx
            pruned_count = prune_expired_storage_videos(max_age_days=7, max_videos=20)
            if pruned_count > 0:
                logger.info("Auto-pruned %d expired video(s) from storage bucket.", pruned_count)
        except Exception as storage_err:
            logger.warning("Storage upload/pruning failed (falling back): %s", storage_err)

        final_video_url = youtube_url or public_storage_url or f"/output/{result.video_path.name}"

        if job_id:
            update_video_job_record(
                job_id=job_id,
                status=VideoJobStatus.COMPLETED,
                progress_pct=100,
                video_url=final_video_url,
                duration_seconds=result.duration_seconds,
                file_size_bytes=result.file_size_bytes,
                script_data=result.script.model_dump(),
            )

        print(f"\n=======================================================")
        print(f" ALL JOBS COMPLETE!")
        print(f" Video Path:   {result.video_path}")
        print(f" Duration:     {result.duration_seconds:.2f}s")
        if youtube_url:
            print(f" YouTube Link: {youtube_url}")
        if public_storage_url:
            print(f" Storage CDN:  {public_storage_url}")
        print(f"=======================================================\n")


    except Exception as e:
        logger.exception("Cloud rendering/publishing failed: %s", e)
        if job_id:
            update_video_job_record(
                job_id=job_id,
                status=VideoJobStatus.FAILED,
                error_message=str(e),
            )
        sys.exit(1)


if __name__ == "__main__":
    main()
