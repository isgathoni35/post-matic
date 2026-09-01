"""Tests for Pexels Stock Video Downloader."""
from pathlib import Path
import pytest
from engine.media_downloader import (
    DownloadedVideo,
    fetch_scene_media,
    search_pexels_video,
    select_best_video_file,
)


def test_select_best_video_file():
    """Verify selection logic prefers 1080x1920 MP4 files."""
    video_files = [
        {"file_type": "video/mp4", "width": 1920, "height": 1080, "link": "https://example.com/h.mp4"},
        {"file_type": "video/mp4", "width": 1080, "height": 1920, "link": "https://example.com/v_1080.mp4"},
        {"file_type": "video/mp4", "width": 720, "height": 1280, "link": "https://example.com/v_720.mp4"},
        {"file_type": "video/webm", "width": 1080, "height": 1920, "link": "https://example.com/v.webm"},
    ]

    best = select_best_video_file(video_files)
    assert best is not None
    assert best["width"] == 1080
    assert best["height"] == 1920
    assert best["link"] == "https://example.com/v_1080.mp4"


def test_search_and_fetch_scene_media(tmp_path: Path):
    """Verify live search and download of vertical video assets."""
    keywords = ["aurora borealis northern lights vertical", "night sky timelapse vertical"]
    video = fetch_scene_media(
        scene_id=1,
        keywords=keywords,
        target_duration=4.0,
        output_dir=tmp_path,
    )

    assert isinstance(video, DownloadedVideo)
    assert video.scene_id == 1
    assert video.video_id > 0
    assert video.file_path.exists()
    assert video.file_path.stat().st_size > 0
    assert video.width > 0
    assert video.height > 0
    assert video.duration > 0.0


if __name__ == "__main__":
    import tempfile
    with tempfile.TemporaryDirectory() as td:
        test_select_best_video_file()
        test_search_and_fetch_scene_media(Path(td))
    print("All media downloader tests passed!")
