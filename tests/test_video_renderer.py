"""Tests for FFmpeg video rendering orchestrator."""
from pathlib import Path
import subprocess
import pytest

from engine.schema import Scene, VideoScript
from engine.tts_engine import synthesize_script
from engine.media_downloader import fetch_script_media
from engine.video_renderer import (
    get_ffmpeg_binary,
    process_scene_clip,
    concatenate_clips,
    burn_audio_and_subtitles,
    render_video,
)


def test_get_ffmpeg_binary():
    """Verify that FFmpeg binary is found and operational."""
    ffmpeg_bin = get_ffmpeg_binary()
    assert ffmpeg_bin is not None
    res = subprocess.run([ffmpeg_bin, "-version"], capture_output=True, text=True)
    assert res.returncode == 0
    assert "ffmpeg version" in res.stdout


def test_render_video_end_to_end(tmp_path: Path):
    """Verify complete end-to-end rendering pipeline on a sample script."""
    script = VideoScript(
        title="Test Rendering Volcano",
        description="Testing complete video rendering",
        tags=["volcano", "render"],
        scenes=[
            Scene(
                scene_id=1,
                narration="Did you know volcanic lightning actually exists?",
                visual_description="Volcano eruption night",
                search_keywords=["volcano night vertical", "lightning vertical"],
            ),
            Scene(
                scene_id=2,
                narration="It happens when ash particles collide at incredible speeds.",
                visual_description="Volcanic smoke",
                search_keywords=["volcanic ash vertical", "smoke cloud vertical"],
            ),
        ],
    )

    # 1. Synthesize audio & subtitles
    tts_result = synthesize_script(script, output_dir=tmp_path / "tts")
    assert tts_result.audio_path.exists()
    assert tts_result.subtitle_path.exists()

    # 2. Fetch media
    scene_durations = {s.scene_id: s.duration for s in tts_result.scene_results}
    videos = fetch_script_media(script, scene_durations=scene_durations, output_dir=tmp_path / "media")
    assert len(videos) == 2

    # 3. Render final video
    output_mp4 = tmp_path / "output.mp4"
    rendered_path = render_video(
        downloaded_videos=videos,
        tts_result=tts_result,
        output_path=output_mp4,
        render_dir=tmp_path / "render",
    )

    assert rendered_path.exists()
    assert rendered_path.stat().st_size > 50_000  # Non-trivial MP4 file size

    # Verify video resolution using ffprobe or ffmpeg
    ffmpeg_bin = get_ffmpeg_binary()
    probe = subprocess.run(
        [ffmpeg_bin, "-i", str(rendered_path)],
        capture_output=True,
        text=True,
    )
    # Output stderr from ffmpeg contains stream info: 1080x1920
    assert "1080x1920" in probe.stderr
    assert "Audio: aac" in probe.stderr


def test_burn_audio_and_subtitles_with_bgm(tmp_path: Path):
    """Verify that burn_audio_and_subtitles correctly mixes ambient BGM with narration."""
    ffmpeg_bin = get_ffmpeg_binary()

    # Generate small 3-second dummy video track
    dummy_video = tmp_path / "dummy_video.mp4"
    subprocess.run(
        [ffmpeg_bin, "-y", "-f", "lavfi", "-i", "color=c=black:s=1080x1920:d=3", "-c:v", "libx264", "-t", "3", str(dummy_video)],
        check=True,
        capture_output=True,
    )

    # Generate small dummy narration audio
    dummy_audio = tmp_path / "dummy_audio.mp3"
    subprocess.run(
        [ffmpeg_bin, "-y", "-f", "lavfi", "-i", "sine=frequency=440:duration=3", "-c:a", "libmp3lame", "-b:a", "128k", str(dummy_audio)],
        check=True,
        capture_output=True,
    )

    # Dummy BGM
    dummy_bgm = tmp_path / "dummy_bgm.mp3"
    subprocess.run(
        [ffmpeg_bin, "-y", "-f", "lavfi", "-i", "sine=frequency=220:duration=5", "-c:a", "libmp3lame", "-b:a", "128k", str(dummy_bgm)],
        check=True,
        capture_output=True,
    )

    output_mux = tmp_path / "final_with_bgm.mp4"
    res = burn_audio_and_subtitles(
        video_track_path=dummy_video,
        audio_path=dummy_audio,
        subtitle_path=None,
        output_path=output_mux,
        bgm_path=dummy_bgm,
        bgm_volume=0.08,
    )

    assert res.exists()
    assert res.stat().st_size > 10_000
    probe = subprocess.run([ffmpeg_bin, "-i", str(res)], capture_output=True, text=True)
    assert "Audio: aac" in probe.stderr
