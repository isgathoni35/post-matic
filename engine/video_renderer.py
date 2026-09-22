"""FFmpeg Video Rendering and Assembly Orchestrator."""
import logging
import os
from pathlib import Path
import shutil
import subprocess
import sys
from typing import Callable, List, Optional, Union

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



IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".bmp"}


def image_to_ken_burns_clip(
    image_path: Path,
    target_duration: float,
    output_path: Path,
    target_width: int = 1080,
    target_height: int = 1920,
    target_fps: int = 30,
    zoom_in: bool = True,
    camera_movement: str = "slow_push_in",
    ffmpeg_bin: Optional[str] = None,
) -> Path:
    """Convert a static image into a vertical video with cinematic 2.5D camera motion.

    Supports action shakes, flight whoosh pans, punch zooms, and subtle Ken Burns drift.
    """
    ffmpeg = ffmpeg_bin or get_ffmpeg_binary()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    mode = camera_movement.lower() if camera_movement else ("slow_push_in" if zoom_in else "zoom_out")

    if "shake" in mode or "combat" in mode:
        # Action combat camera shake
        zoom_expr = "1.08"
        x_expr = "'iw/2-(iw/zoom/2)+10*sin(40*on)'"
        y_expr = "'ih/2-(ih/zoom/2)+10*cos(40*on)'"
    elif "whoosh" in mode or "flight" in mode or "up" in mode or "superman" in mode:
        # Fast upward flight takeoff pan
        zoom_expr = "1.12"
        x_expr = "'iw/2-(iw/zoom/2)'"
        y_expr = f"'max(0, (ih/2-(ih/zoom/2)) - (on/({target_fps}*{max(1.0, target_duration)}))*120)'"
    elif "punch" in mode or "fast_zoom" in mode:
        # High impact dynamic push-in
        zoom_expr = "min(zoom+0.0035,1.25)"
        x_expr = "'iw/2-(iw/zoom/2)'"
        y_expr = "'ih/2-(ih/zoom/2)'"
    elif "pan_left" in mode:
        zoom_expr = "1.10"
        x_expr = f"'(on/({target_fps}*{max(1.0, target_duration)}))*(iw-(iw/zoom))'"
        y_expr = "'ih/2-(ih/zoom/2)'"
    elif "pan_right" in mode:
        zoom_expr = "1.10"
        x_expr = f"'(1-on/({target_fps}*{max(1.0, target_duration)}))*(iw-(iw/zoom))'"
        y_expr = "'ih/2-(ih/zoom/2)'"
    elif mode == "zoom_out":
        zoom_expr = "if(lte(zoom,1.0),1.15,max(1.001,zoom-0.0012))"
        x_expr = "'iw/2-(iw/zoom/2)'"
        y_expr = "'ih/2-(ih/zoom/2)'"
    else:
        # Default smooth cinematic slow push-in
        zoom_expr = "min(zoom+0.0012,1.15)"
        x_expr = "'iw/2-(iw/zoom/2)'"
        y_expr = "'ih/2-(ih/zoom/2)'"

    filtergraph = (
        f"scale={target_width}:{target_height}:force_original_aspect_ratio=increase,"
        f"crop={target_width}:{target_height},"
        f"zoompan=z='{zoom_expr}':d=1:x={x_expr}:y={y_expr}:s={target_width}x{target_height}:fps={target_fps},"
        f"setsar=1,fps={target_fps},format=yuv420p"
    )

    cmd = [
        ffmpeg,
        "-y",
        "-loop", "1",
        "-i", str(image_path),
        "-t", f"{target_duration:.3f}",
        "-vf", filtergraph,
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-crf", "20",
        "-an",
        str(output_path),
    ]

    run_ffmpeg_command(cmd, error_context=f"Rendering 2.5D camera clip ({mode}) for {image_path.name}")
    return output_path


def process_scene_clip(
    video_path: Path,
    target_duration: float,
    output_path: Path,
    target_width: int = 1080,
    target_height: int = 1920,
    target_fps: int = 30,
    camera_movement: str = "slow_push_in",
    ffmpeg_bin: Optional[str] = None,
) -> Path:
    """Trim and normalize a single video clip or still AI image to target duration and 1080x1920 9:16 aspect ratio.

    Applies aspect ratio scaling with center crop (`force_original_aspect_ratio=increase,crop=1080:1920`),
    sets frame rate to 30fps and pixel format to yuv420p. If the input is an image, applies 2.5D camera motion.
    """
    ffmpeg = ffmpeg_bin or get_ffmpeg_binary()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # If the scene asset is a still image (e.g. from Google Imagen 3), animate it with 2.5D camera motion
    if video_path.suffix.lower() in IMAGE_EXTENSIONS:
        return image_to_ken_burns_clip(
            image_path=video_path,
            target_duration=target_duration,
            output_path=output_path,
            target_width=target_width,
            target_height=target_height,
            target_fps=target_fps,
            camera_movement=camera_movement,
            ffmpeg_bin=ffmpeg,
        )

    # Filter complex to scale and crop video to 9:16 vertical canvas
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


DEFAULT_BGM_PATH = PROJECT_ROOT / "assets" / "audio" / "cinematic_ambient.mp3"


def burn_audio_and_subtitles(
    video_track_path: Path,
    audio_path: Path,
    subtitle_path: Optional[Path],
    output_path: Path,
    bgm_path: Optional[Union[Path, str]] = None,
    bgm_volume: float = 0.08,
    ffmpeg_bin: Optional[str] = None,
) -> Path:
    """Combine video track with master audio, optional ducked BGM, and burn ASS animated subtitles."""
    ffmpeg = ffmpeg_bin or get_ffmpeg_binary()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    has_bgm = bgm_path is not None and Path(bgm_path).exists()

    if has_bgm:
        cmd = [
            ffmpeg,
            "-y",
            "-i", str(video_track_path),
            "-i", str(audio_path),
            "-stream_loop", "-1",
            "-i", str(bgm_path),
        ]
        filter_parts = []
        if subtitle_path and subtitle_path.exists():
            sub_escaped = str(subtitle_path.resolve()).replace("\\", "/").replace(":", "\\:").replace("'", "\\'")
            filter_parts.append(f"[0:v]ass='{sub_escaped}'[vout]")
            v_map = "[vout]"
        else:
            v_map = "0:v"

        # Duck BGM underneath master narration (-22dB volume bed) with subtle fade-in and mix
        filter_parts.append(
            f"[2:a]volume={bgm_volume},afade=t=in:ss=0:d=1[bgm];"
            f"[1:a][bgm]amix=inputs=2:duration=first:dropout_transition=2:normalize=0[aout]"
        )

        cmd.extend([
            "-filter_complex", ";".join(filter_parts),
            "-map", v_map,
            "-map", "[aout]",
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "19",
            "-c:a", "aac",
            "-b:a", "192k",
            "-pix_fmt", "yuv420p",
            "-movflags", "+faststart",
            "-shortest",
            str(output_path),
        ])
    else:
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
            "-preset", "fast",
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
    video_format: str = "short",
    bgm_path: Optional[Union[Path, str, bool]] = None,
    bgm_volume: float = 0.08,
    progress_callback: Optional[Callable[[str, int], None]] = None,
) -> Path:
    """Orchestrates the entire FFmpeg rendering pipeline.

    1. Trims and normalizes each downloaded scene video to match scene audio duration.
    2. Concatenates all scene clips into a single video track.
    3. Overlays narration audio, ducks ambient background music, and burns animated ASS subtitles.
    4. Produces a production-ready MP4 (1080x1920 for short, 1920x1080 for long).
    """
    work_dir = render_dir or (TEMP_DIR / "render")
    work_dir.mkdir(parents=True, exist_ok=True)

    final_output = output_path or (OUTPUT_DIR / "final_video.mp4")
    final_output.parent.mkdir(parents=True, exist_ok=True)

    # Resolve background music
    resolved_bgm: Optional[Path] = None
    if bgm_path is False or (isinstance(bgm_path, str) and bgm_path.lower() in ("none", "false", "off")):
        resolved_bgm = None
    elif isinstance(bgm_path, (str, Path)) and Path(bgm_path).exists():
        resolved_bgm = Path(bgm_path)
    elif bgm_path is None and DEFAULT_BGM_PATH.exists():
        resolved_bgm = DEFAULT_BGM_PATH

    if video_format == "long":
        target_width, target_height = 1920, 1080
    else:
        target_width, target_height = 1080, 1920

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

        if progress_callback:
            clip_pct = 85 + int((idx / max(1, total_scenes)) * 7)
            progress_callback("rendering", clip_pct)

        norm_path = work_dir / f"scene_{vid.scene_id}_norm.mp4"
        logger.info(
            "Rendering Scene %d: trimming to %.2fs and resizing to %dx%d (%s)...",
            vid.scene_id,
            dur,
            target_width,
            target_height,
            video_format,
        )
        process_scene_clip(
            video_path=vid.file_path,
            target_duration=dur,
            output_path=norm_path,
            target_width=target_width,
            target_height=target_height,
        )
        normalized_clips.append(norm_path)

    # Step 2: Concatenate normalized clips
    if progress_callback:
        progress_callback("rendering", 93)

    concat_video_path = work_dir / "concatenated_video.mp4"
    logger.info("Concatenating %d scene video clips...", len(normalized_clips))
    concatenate_clips(normalized_clips, concat_video_path)

    # Step 3: Overlay audio and burn subtitles
    if progress_callback:
        progress_callback("rendering", 96)

    logger.info(
        "Burning audio and ASS subtitles into final video: %s (BGM: %s)",
        final_output,
        resolved_bgm.name if resolved_bgm else "None",
    )
    burn_audio_and_subtitles(
        video_track_path=concat_video_path,
        audio_path=tts_result.audio_path,
        subtitle_path=tts_result.subtitle_path,
        output_path=final_output,
        bgm_path=resolved_bgm,
        bgm_volume=bgm_volume,
    )

    if progress_callback:
        progress_callback("rendering", 99)

    logger.info("Video rendering successfully completed: %s", final_output)
    return final_output
