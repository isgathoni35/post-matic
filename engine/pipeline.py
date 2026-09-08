"""Master End-to-End Video Generation Pipeline."""
from dataclasses import dataclass
import logging
from pathlib import Path
import shutil
import sys
import time
from typing import List, Optional

# Ensure project root is on sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from engine.config import OUTPUT_DIR, TEMP_DIR
from engine.media_downloader import DownloadedVideo, fetch_script_media
from engine.schema import VideoScript
from engine.script_generator import generate_script
from engine.tts_engine import DEFAULT_VOICE, TTSResult, synthesize_script
from engine.video_renderer import render_video

logger = logging.getLogger(__name__)


def cleanup_temp_dir() -> None:
    """Safely cleans up intermediate cached media and audio clips from TEMP_DIR."""
    try:
        if TEMP_DIR.exists():
            for item in TEMP_DIR.iterdir():
                if item.is_file():
                    item.unlink(missing_ok=True)
                elif item.is_dir():
                    shutil.rmtree(item, ignore_errors=True)
            logger.info("Temporary render files cleaned up successfully.")
    except Exception as e:
        logger.warning("Could not clean temp directory: %s", e)


@dataclass
class VideoGenerationResult:
    """Complete output payload from the end-to-end video pipeline."""
    video_path: Path
    script: VideoScript
    tts_result: TTSResult
    downloaded_videos: List[DownloadedVideo]
    duration_seconds: float
    file_size_bytes: int
    elapsed_time_seconds: float


def generate_faceless_video(
    topic: str,
    target_duration: int = 30,
    target_scenes: Optional[int] = None,
    voice: str = DEFAULT_VOICE,
    output_path: Optional[Path] = None,
    gemini_api_key: Optional[str] = None,
    pexels_api_key: Optional[str] = None,
    preferred_model: Optional[str] = None,
    words_per_subtitle_line: int = 3,
    cleanup_temp: bool = True,
) -> VideoGenerationResult:
    """Execute the entire 5-stage automated video generation pipeline.

    Stages:
    1. Script Generation (Gemini LLM)
    2. Voice Synthesis & Word Timings & ASS Subtitle Creation (edge-tts)
    3. Vertical Video Asset Sourcing & Downloading (Pexels API)
    4. Programmatic FFmpeg Assembly, Normalization, & Libass Caption Burning
    5. Result Validation & Packaging
    """
    start_time = time.time()
    logger.info("Starting automated video generation for topic: '%s'", topic)

    # 1. Generate Script
    print(f"\n[1/4] Generating script for topic: '{topic}'...")
    script = generate_script(
        topic=topic,
        target_duration=target_duration,
        target_scenes=target_scenes,
        api_key=gemini_api_key,
        preferred_model=preferred_model,
    )
    print(f"      Title: \"{script.title}\" ({len(script.scenes)} scenes)")

    # 2. Voice Synthesis & Subtitles
    print(f"\n[2/4] Synthesizing voiceover with voice '{voice}' and generating ASS subtitles...")
    tts_result = synthesize_script(
        script=script,
        voice=voice,
        words_per_line=words_per_subtitle_line,
    )
    print(f"      Audio duration: {tts_result.total_duration:.2f}s")

    # Map scene durations from audio
    scene_durations = {
        s.scene_id: s.duration for s in tts_result.scene_results
    }

    # 3. Media Sourcing
    print(f"\n[3/4] Sourcing vertical video clips (Pexels Stock + Google Imagen 3 AI Fallback)...", flush=True)
    downloaded_videos = fetch_script_media(
        script=script,
        scene_durations=scene_durations,
        api_key=pexels_api_key,
        gemini_api_key=gemini_api_key,
    )

    # 4. Assembly & Subtitle Burning
    timestamp_slug = int(time.time())
    dest_output = output_path or (OUTPUT_DIR / f"video_{timestamp_slug}.mp4")

    print(f"\n[4/4] Assembling video, normalizing aspect ratio, and burning animated captions with FFmpeg...")
    final_video = render_video(
        downloaded_videos=downloaded_videos,
        tts_result=tts_result,
        output_path=dest_output,
    )

    elapsed = time.time() - start_time
    file_size = final_video.stat().st_size

    print(f"\n=======================================================")
    print(f" SUCCESS! Video successfully generated in {elapsed:.1f}s")
    print(f" File:     {final_video}")
    print(f" Size:     {file_size / (1024 * 1024):.2f} MB")
    print(f" Duration: {tts_result.total_duration:.2f}s")
    print(f" Title:    {script.title}")
    print(f" Tags:     {', '.join(script.tags)}")
    print(f"=======================================================\n")

    if cleanup_temp:
        cleanup_temp_dir()

    return VideoGenerationResult(
        video_path=final_video,
        script=script,
        tts_result=tts_result,
        downloaded_videos=downloaded_videos,
        duration_seconds=tts_result.total_duration,
        file_size_bytes=file_size,
        elapsed_time_seconds=elapsed,
    )
