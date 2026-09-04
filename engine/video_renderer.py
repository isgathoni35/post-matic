"""FFmpeg Video Rendering and Assembly Orchestrator."""
import logging
import os
from pathlib import Path
import shutil
import subprocess
import sys
from typing import List, Optional

# Ensure project root is on sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import imageio_ffmpeg
from engine.config import OUTPUT_DIR, TEMP_DIR
from engine.media_downloader import DownloadedVideo
from engine.tts_engine import TTSResult

logger = logging.getLogger(__name__)


def get_ffmpeg_binary() -> str:
    """Resolve the path to the FFmpeg executable."""
    system_ffmpeg = shutil.which("ffmpeg")
    if system_ffmpeg:
        return system_ffmpeg

    try:
        exe = imageio_ffmpeg.get_ffmpeg_exe()
        if exe and Path(exe).exists():
            return exe
    except Exception:
        pass

    for candidate in [
        PROJECT_ROOT / ".venv" / "Scripts" / "ffmpeg.exe",
        PROJECT_ROOT / ".venv" / "bin" / "ffmpeg",
    ]:
        if candidate.exists() and os.access(candidate, os.X_OK):
            return str(candidate)

    return imageio_ffmpeg.get_ffmpeg_exe()


def run_ffmpeg_command(cmd: List[str], error_context: str = "FFmpeg processing") -> None:
    """Execute an FFmpeg command via subprocess and capture stderr on failure."""
    logger.debug("Executing FFmpeg command: %s", " ".join(cmd))
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if result.returncode != 0:
        logger.error("%s failed with code %d:\n%s", error_context, result.returncode, result.stderr)
        # Filter out progress output (lines starting with 'frame=') to expose actual error
        error_lines = [line for line in result.stderr.splitlines() if not line.startswith("frame=")]
        clean_stderr = "\n".join(error_lines[-40:])
        raise RuntimeError(f"{error_context} failed:\n{clean_stderr}")



def process_scene_clip(
    video_path: Path,
    target_duration: float,
    output_path: Path,
    target_width: int = 1080,
    target_height: int = 1920,
    target_fps: int = 30,
    ffmpeg_bin: Optional[str] = None,
) -> Path:
    """Trim and normalize a single video clip to target duration and 1080x1920 9:16 aspect ratio.

    Applies aspect ratio scaling with center crop (`force_original_aspect_ratio=increase,crop=1080:1920`),
    sets frame rate to 30fps and pixel format to yuv420p.
    """
    ffmpeg = ffmpeg_bin or get_ffmpeg_binary()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Filter complex to scale and crop to 9:16 vertical canvas
    filtergraph = (
        f"scale={target_width}:{target_height}:force_original_aspect_ratio=increase,"
        f"crop={target_width}:{target_height},"
        f"setsar=1,fps={target_fps},format=yuv420p"
    )

    # If stock video is shorter than needed duration, loop input
    cmd = [
        ffmpeg,
        "-y",
        "-stream_loop", "-1",
        "-i", str(video_path),
        "-t", f"{target_duration:.3f}",
        "-vf", filtergraph,
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-crf", "20",
        "-an",
        str(output_path),
    ]

    run_ffmpeg_command(cmd, error_context=f"Normalizing scene clip {video_path.name}")
    return output_path


def concatenate_clips(
    clip_paths: List[Path],
    output_path: Path,
    ffmpeg_bin: Optional[str] = None,
) -> Path:
    """Concatenate multiple normalized MP4 clips using the FFmpeg concat demuxer."""
    ffmpeg = ffmpeg_bin or get_ffmpeg_binary()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Write concat list file
    concat_list_file = output_path.parent / "concat_list.txt"
    with open(concat_list_file, "w", encoding="utf-8") as f:
        for p in clip_paths:
            # Escape single quotes in file paths
            escaped_path = str(p.resolve()).replace("'", "'\\''")
            f.write(f"file '{escaped_path}'\n")

    cmd = [
        ffmpeg,
        "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", str(concat_list_file),
        "-c", "copy",
        str(output_path),
    ]

    run_ffmpeg_command(cmd, error_context="Concatenating scene clips")
    return output_path


def burn_audio_and_subtitles(
    video_track_path: Path,
    audio_path: Path,
    subtitle_path: Optional[Path],
    output_path: Path,
    ffmpeg_bin: Optional[str] = None,
) -> Path:
    """Combine video track with master audio and burn ASS animated subtitles."""
    ffmpeg = ffmpeg_bin or get_ffmpeg_binary()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    cmd = [
        ffmpeg,
        "-y",
        "-i", str(video_track_path),
        "-i", str(audio_path),
    ]

    if subtitle_path and subtitle_path.exists():
        # Escape special characters for the FFmpeg filter syntax
        sub_escaped = str(subtitle_path.resolve()).replace("\\", "/").replace(":", "\\:").replace("'", "\\'")
        # Burn ASS subtitles directly onto the video stream using libass
        cmd.extend([
            "-vf", f"ass='{sub_escaped}'",
        ])

    cmd.extend([
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "19",
        "-c:a", "aac",
        "-b:a", "192k",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        "-shortest",
        str(output_path),
    ])

    run_ffmpeg_command(cmd, error_context="Burning audio and subtitles into final MP4")
    return output_path


def render_video(
    downloaded_videos: List[DownloadedVideo],
    tts_result: TTSResult,
    output_path: Optional[Path] = None,
    render_dir: Optional[Path] = None,
) -> Path:
    """Orchestrates the entire FFmpeg rendering pipeline.

    1. Trims and normalizes each downloaded scene video to match scene audio duration.
    2. Concatenates all scene clips into a single video track.
    3. Overlays narration audio and burns animated ASS subtitles.
    4. Produces a production-ready 1080x1920 vertical video MP4.
    """
    work_dir = render_dir or (TEMP_DIR / "render")
    work_dir.mkdir(parents=True, exist_ok=True)

    final_output = output_path or (OUTPUT_DIR / "final_video.mp4")
    final_output.parent.mkdir(parents=True, exist_ok=True)

    # Map scene audio durations
    scene_durations = {
        s.scene_id: s.duration for s in tts_result.scene_results
    }

    # Step 1: Process and normalize each scene clip
    normalized_clips: List[Path] = []
    total_audio_dur = tts_result.total_duration
    total_scenes = len(downloaded_videos)

    for idx, vid in enumerate(downloaded_videos):
        dur = scene_durations.get(vid.scene_id, 5.0)
        # For the final scene, add a slight safety buffer so -shortest never clips trailing narration
        if idx == total_scenes - 1:
            preceding_sum = sum(scene_durations.get(v.scene_id, 5.0) for v in downloaded_videos[:-1])
            dur = max(dur, total_audio_dur - preceding_sum + 0.3)

        norm_path = work_dir / f"scene_{vid.scene_id}_norm.mp4"
        logger.info(
            "Rendering Scene %d: trimming to %.2fs and resizing to 1080x1920...",
            vid.scene_id,
            dur,
        )
        process_scene_clip(
            video_path=vid.file_path,
            target_duration=dur,
            output_path=norm_path,
        )
        normalized_clips.append(norm_path)

    # Step 2: Concatenate normalized clips
    concat_video_path = work_dir / "concatenated_video.mp4"
    logger.info("Concatenating %d scene video clips...", len(normalized_clips))
    concatenate_clips(normalized_clips, concat_video_path)

    # Step 3: Overlay audio and burn subtitles
    logger.info("Burning audio and ASS subtitles into final video: %s", final_output)
    burn_audio_and_subtitles(
        video_track_path=concat_video_path,
        audio_path=tts_result.audio_path,
        subtitle_path=tts_result.subtitle_path,
        output_path=final_output,
    )

    logger.info("Video rendering successfully completed: %s", final_output)
    return final_output
