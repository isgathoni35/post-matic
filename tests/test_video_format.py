"""Unit and integration tests for Short (9:16) vs Long (16:9) format support and progress reporting."""
from pathlib import Path
from unittest.mock import MagicMock, patch
import pytest

from engine.schema import Scene, VideoScript
from engine.tts_engine import create_ass_header, synthesize_script
from engine.media_downloader import select_best_video_file
from engine.pipeline import generate_faceless_video


def test_ass_header_aspect_ratios():
    """Verify ASS headers configure proper canvas resolutions for 9:16 and 16:9."""
    # 1. 9:16 Portrait Canvas
    header_portrait = create_ass_header(aspect_ratio="9:16")
    assert "PlayResX: 1080" in header_portrait
    assert "PlayResY: 1920" in header_portrait
    assert ",580" in header_portrait  # margin_v for portrait safe bounds

    # 2. 16:9 Landscape Widescreen Canvas
    header_landscape = create_ass_header(aspect_ratio="16:9")
    assert "PlayResX: 1920" in header_landscape
    assert "PlayResY: 1080" in header_landscape
    assert ",120" in header_landscape  # margin_v for landscape lower third


def test_select_best_video_file_orientations():
    """Verify video file selection filters landscape for long and portrait for short."""
    files = [
        {"id": 1, "width": 1080, "height": 1920, "link": "http://example.com/portrait.mp4", "file_type": "video/mp4"},
        {"id": 2, "width": 1920, "height": 1080, "link": "http://example.com/landscape.mp4", "file_type": "video/mp4"},
    ]

    best_short = select_best_video_file(files, video_format="short")
    assert best_short["id"] == 1

    best_long = select_best_video_file(files, video_format="long")
    assert best_long["id"] == 2


@patch("engine.pipeline.generate_script")
@patch("engine.pipeline.synthesize_script")
@patch("engine.pipeline.fetch_script_media")
@patch("engine.pipeline.render_video")
def test_generate_faceless_video_progress_callback(
    mock_render,
    mock_fetch,
    mock_synth,
    mock_gen,
    tmp_path: Path,
):
    """Verify progress callback is triggered at all 5 milestones."""
    dummy_script = VideoScript(
        title="Test Story",
        description="Desc",
        tags=["test"],
        scenes=[Scene(scene_id=1, narration="Test text", visual_description="Test visual", search_keywords=["kw"])],
    )
    mock_gen.return_value = dummy_script

    mock_tts = MagicMock()
    mock_tts.scene_results = [MagicMock(scene_id=1, duration=5.0)]
    mock_tts.total_duration = 5.0
    mock_synth.return_value = mock_tts

    mock_fetch.return_value = []
    dummy_output = tmp_path / "final.mp4"
    dummy_output.write_bytes(b"testmp4")
    mock_render.return_value = dummy_output

    milestones = []

    def on_progress(status: str, pct: int, data=None):
        milestones.append((status, pct))

    result = generate_faceless_video(
        topic="Progress Test",
        target_duration=15,
        video_format="long",
        progress_callback=on_progress,
    )

    assert result is not None
    # Verify stages in order: scripting (15, 25) -> synthesizing (35, 50) -> sourcing (60, 75) -> rendering (85)
    pcts = [m[1] for m in milestones]
    assert 15 in pcts
    assert 25 in pcts
    assert 35 in pcts
    assert 50 in pcts
    assert 60 in pcts
    assert 75 in pcts
    assert 85 in pcts
