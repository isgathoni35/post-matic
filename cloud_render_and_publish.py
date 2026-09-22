#!/usr/bin/env python3
"""Cloud rendering and publishing worker entrypoint for GitHub Actions or CLI execution."""
import argparse
import asyncio
import logging
import json
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
from engine.pipeline import generate_faceless_video, generate_animated_story_video
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
    parser.add_argument("--mode", type=str, default="shorts", choices=["shorts", "story"], help="Video generation mode ('shorts' or 'story')")
    parser.add_argument("--story-style", "--style", dest="story_style", type=str, default="anime", choices=["anime", "donghua", "stickman", "3d_cartoon"], help="Style for animated story")
    parser.add_argument("--characters", type=str, default=None, help="JSON serialized custom characters")
    parser.add_argument("--music-track", type=str, default=None, help="Background music preset name or URL")
    parser.add_argument("--subtitle-style", type=str, default="hormozi_yellow", help="Subtitle visual preset style")
    parser.add_argument("--options-json", type=str, default=None, help="JSON serialized options dict containing nested settings")

    args = parser.parse_args()

    # Unpack nested options if passed via --options-json
    if args.options_json:
        try:
            opts = json.loads(args.options_json)
            if isinstance(opts, dict):
                if opts.get("privacy"): args.privacy = opts["privacy"]
                if opts.get("video_format"): args.video_format = opts["video_format"]
                if opts.get("target_platform"): args.platform = opts["target_platform"]
                if opts.get("mode"): args.mode = opts["mode"]
                if opts.get("story_style"): args.story_style = opts["story_style"]
                if opts.get("characters") and not args.characters:
                    args.characters = json.dumps(opts["characters"])
                if opts.get("music_track") and not args.music_track:
                    args.music_track = opts["music_track"]
                if opts.get("subtitle_style") and not args.subtitle_style:
                    args.subtitle_style = opts["subtitle_style"]
        except Exception as opt_err:
            logger.warning("Could not parse options-json: %s", opt_err)

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
        if args.mode == "story":
            logger.info("Starting cloud animated story generation for topic: '%s' (style: %s)...", args.topic, args.story_style)
            custom_characters = None
            if args.characters:
                try:
                    custom_characters = json.loads(args.characters)
                except Exception as e:
                    logger.warning("Could not parse custom characters JSON: %s", e)

            def story_progress(status_name: str, pct: int, payload: Optional[dict] = None):
                status_enum = {
                    "scripting": "scripting",
                    "synthesizing": "synthesizing",
                    "foley_mixing": "synthesizing",
                    "sourcing_visuals": "sourcing_media",
                    "rendering": "rendering",
                }.get(status_name, "rendering")
                on_progress(status_enum, pct, payload if status_name == "scripting" else None)

            result = generate_animated_story_video(
                topic=args.topic,
                style=args.story_style,
                target_duration=args.duration,
                custom_characters=custom_characters,
                progress_callback=story_progress,
            )
        else:
            logger.info("Starting cloud generation for topic: '%s' (format: %s)...", args.topic, args.video_format)
            result = generate_faceless_video(
                topic=args.topic,
                target_duration=args.duration,
                voice=args.voice,
                video_format=args.video_format,
                progress_callback=on_progress,
            )

        logger.info("Video generation completed: %s (%d bytes)", result.video_path, result.file_size_bytes)

        # 1. Upload rendered video to persistent Supabase Storage CDN first
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

        # 2. Attempt social publishing (with graceful error capture)
        social_url = None
        social_publish_err = None
        if args.publish_youtube:
            target_platform = (args.platform or "youtube").lower()
            try:
                access_token = args.access_token

                if not access_token:
                    # Find connected social account from database
                    accounts = get_social_accounts(user_id=args.user_id)
                    target_acc = next((a for a in accounts if a.get("platform") == target_platform), None)
                    if not target_acc:
                        raise RuntimeError(
                            f"No connected {target_platform.title()} account found for user '{args.user_id}'. "
                            f"Please link your {target_platform.title()} account first via the Studio Dashboard."
                        )

                    logger.info("Verifying access token expiration for %s account '%s'...", target_platform, target_acc.get("id"))
                    access_token, was_refreshed = asyncio.run(ensure_valid_access_token(target_acc))
                    if was_refreshed:
                        logger.info("%s access token was successfully refreshed prior to upload.", target_platform.title())

                tags_formatted = ' #'.join(result.script.tags) if result.script.tags else ""
                is_short = (args.video_format == "short")
                if is_short:
                    desc = f"{result.script.description}\n\n#Shorts #{tags_formatted}"
                else:
                    desc = f"{result.script.description}\n\n#{tags_formatted}" if tags_formatted else result.script.description

                if target_platform == "youtube":
                    logger.info("Publishing video to YouTube (%s)...", "Shorts" if is_short else "Standard Video")
                    upload_res = upload_video_to_youtube(
                        video_file_path=result.video_path,
                        title=result.script.title,
                        description=desc,
                        tags=result.script.tags,
                        access_token=access_token,
                        privacy_status=args.privacy,
                        video_format=args.video_format,
                    )
                    social_url = upload_res.youtube_url
                    logger.info("Published YouTube URL: %s", social_url)

                elif target_platform == "tiktok":
                    logger.info("Publishing video to TikTok feed...")
                    from engine.social.tiktok_uploader import upload_video_to_tiktok
                    tiktok_privacy = "PUBLIC_TO_EVERYONE" if args.privacy == "public" else "SELF_ONLY"
                    tt_res = upload_video_to_tiktok(
                        video_file_path=result.video_path,
                        title=result.script.title,
                        access_token=access_token,
                        privacy_level=tiktok_privacy,
                    )
                    social_url = tt_res.tiktok_url
                    logger.info("Published TikTok URL: %s", social_url)

                elif target_platform == "instagram":
                    logger.info("Publishing video to Instagram Reels...")
                    from engine.social.instagram_uploader import upload_video_to_instagram
                    ig_res = upload_video_to_instagram(
                        video_file_path=result.video_path,
                        caption=desc,
                        access_token=access_token,
                    )
                    social_url = ig_res.instagram_url
                    logger.info("Published Instagram Reels URL: %s", social_url)

            except Exception as pub_err:
                logger.error("Social publishing to %s failed: %s", target_platform, pub_err)
                social_publish_err = f"Video rendered successfully, but {target_platform.title()} upload failed: {pub_err}"

        final_video_url = social_url or public_storage_url or f"/output/{result.video_path.name}"

        if job_id:
            update_video_job_record(
                job_id=job_id,
                status=VideoJobStatus.COMPLETED,
                progress_pct=100,
                video_url=final_video_url,
                duration_seconds=result.duration_seconds,
                file_size_bytes=result.file_size_bytes,
                script_data=result.script.model_dump(),
                error_message=social_publish_err,
            )

        print(f"\n=======================================================")
        print(f" ALL JOBS COMPLETE!")
        print(f" Video Path:   {result.video_path}")
        print(f" Duration:     {result.duration_seconds:.2f}s")
        if social_url:
            print(f" Social Link: {social_url}")
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
