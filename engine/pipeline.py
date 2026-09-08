"""Master End-to-End Video Generation Pipeline."""
from dataclasses import dataclass
import logging
from pathlib import Path
import shutil
import sys
import time
from typing import Callable, Dict, List, Optional, Union

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


ProgressCallback = Callable[[str, int, Optional[dict]], None]


def generate_faceless_video(
    topic: str,
    target_duration: int = 30,
    target_scenes: Optional[int] = None,
    voice: str = DEFAULT_VOICE,
    video_format: str = "short",
    output_path: Optional[Path] = None,
    gemini_api_key: Optional[str] = None,
    pexels_api_key: Optional[str] = None,
    preferred_model: Optional[str] = None,
    words_per_subtitle_line: int = 3,
    bgm_path: Optional[Union[Path, str, bool]] = None,
    cleanup_temp: bool = True,
    progress_callback: Optional[ProgressCallback] = None,
) -> VideoGenerationResult:
    """Execute the entire 5-stage automated video generation pipeline.

    Stages:
    1. Script Generation (Gemini LLM)
    2. Voice Synthesis & Word Timings & ASS Subtitle Creation (edge-tts)
    3. Video Asset Sourcing & Downloading (Pexels API + Imagen 3)
    4. Programmatic FFmpeg Assembly, Normalization, & Libass Caption Burning
    5. Result Validation & Packaging
    """
    start_time = time.time()
    aspect_ratio = "16:9" if video_format == "long" else "9:16"
    logger.info("Starting automated video generation for topic: '%s' (format: %s, aspect: %s)", topic, video_format, aspect_ratio)

    def report_progress(status: str, pct: int, script_data: Optional[dict] = None):
        if progress_callback:
            try:
                progress_callback(status, pct, script_data)
            except Exception as cb_err:
                logger.warning("Progress callback failed: %s", cb_err)

    # 1. Generate Script
    report_progress("scripting", 15)
    print(f"\n[1/4] Generating script for topic: '{topic}'...")
    script = generate_script(
        topic=topic,
        target_duration=target_duration,
        target_scenes=target_scenes,
        api_key=gemini_api_key,
        preferred_model=preferred_model,
    )
    print(f"      Title: \"{script.title}\" ({len(script.scenes)} scenes)")
    report_progress("scripting", 25, script.model_dump())

    # 2. Voice Synthesis & Subtitles
    report_progress("synthesizing", 35)
    print(f"\n[2/4] Synthesizing voiceover with voice '{voice}' and generating ASS subtitles ({aspect_ratio})...")
    tts_result = synthesize_script(
        script=script,
        voice=voice,
        words_per_line=words_per_subtitle_line,
        aspect_ratio=aspect_ratio,
    )
    print(f"      Audio duration: {tts_result.total_duration:.2f}s")
    report_progress("synthesizing", 50)

    # Map scene durations from audio
    scene_durations = {
        s.scene_id: s.duration for s in tts_result.scene_results
    }

    # 3. Media Sourcing
    report_progress("sourcing_media", 60)
    print(f"\n[3/4] Sourcing video clips (Pexels Stock + Google Imagen 3 AI Fallback, format: {video_format})...", flush=True)
    downloaded_videos = fetch_script_media(
        script=script,
        scene_durations=scene_durations,
        api_key=pexels_api_key,
        gemini_api_key=gemini_api_key,
        video_format=video_format,
    )
    report_progress("sourcing_media", 75)

    # 4. Assembly & Subtitle Burning
    report_progress("rendering", 85)
    timestamp_slug = int(time.time())
    dest_output = output_path or (OUTPUT_DIR / f"video_{timestamp_slug}.mp4")

    print(f"\n[4/4] Assembling video, normalizing to {aspect_ratio}, and burning animated captions with FFmpeg...")
    final_video = render_video(
        downloaded_videos=downloaded_videos,
        tts_result=tts_result,
        output_path=dest_output,
        video_format=video_format,
        bgm_path=bgm_path,
    )
    report_progress("rendering", 95)

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
