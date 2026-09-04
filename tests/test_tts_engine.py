"""Tests for TTS voice synthesis and ASS subtitle generator."""
import pytest
from pathlib import Path
from engine.schema import Scene, VideoScript
from engine.tts_engine import (
    WordTiming,
    format_ass_time,
    generate_ass_subtitles,
    synthesize_scene,
    synthesize_script,
)


def test_format_ass_time():
    """Verify ASS timestamp conversion accuracy."""
    assert format_ass_time(0.0) == "0:00:00.00"
    assert format_ass_time(1.25) == "0:00:01.25"
    assert format_ass_time(65.5) == "0:01:05.50"
    assert format_ass_time(3661.02) == "1:01:01.02"


def test_generate_ass_subtitles(tmp_path: Path):
    """Verify ASS subtitle generation syntax and word highlights."""
    words = [
        WordTiming(text="Hello", start=0.1, end=0.4),
        WordTiming(text="world", start=0.45, end=0.8),
        WordTiming(text="this", start=0.85, end=1.0),
        WordTiming(text="is", start=1.05, end=1.2),
        WordTiming(text="amazing", start=1.25, end=1.8),
    ]

    ass_path = tmp_path / "test.ass"
    generate_ass_subtitles(words, ass_path, words_per_line=3)

    assert ass_path.exists()
    content = ass_path.read_text(encoding="utf-8")

    assert "[Script Info]" in content
    assert "PlayResX: 1080" in content
    assert "PlayResY: 1920" in content
    assert "[V4+ Styles]" in content
    assert "[Events]" in content
    assert "Dialogue: 0,0:00:00.10,0:00:00.40,Default" in content
    assert r"{\c&H0000FFFF&}HELLO{\c&H00FFFFFF&}" in content


def test_synthesize_script_end_to_end(tmp_path: Path):
    """Verify end-to-end TTS synthesis and subtitle synchronization."""
    script = VideoScript(
        title="Test TTS Video",
        description="Testing audio generation and word timestamps",
        tags=["test"],
        scenes=[
            Scene(
                scene_id=1,
                narration="Welcome to the universe of infinite wonders.",
                visual_description="Cosmic stars",
                search_keywords=["stars universe"],
            ),
            Scene(
                scene_id=2,
                narration="Every star has a story waiting to be told.",
                visual_description="Glowing nebula",
                search_keywords=["nebula space"],
            ),
        ],
    )

    result = synthesize_script(script, output_dir=tmp_path)

    assert result.audio_path.exists()
    assert result.audio_path.stat().st_size > 0
    assert result.subtitle_path.exists()
    assert result.subtitle_path.stat().st_size > 0
    assert result.total_duration > 0.0
    assert len(result.scene_results) == 2

    for scene_res in result.scene_results:
        assert scene_res.audio_path.exists()
        assert scene_res.audio_path.stat().st_size > 0
        assert scene_res.duration > 0.0
        assert len(scene_res.words) > 0

def test_generate_ass_subtitles_scene_isolation(tmp_path: Path):
    """Verify that subtitle phrases do not cross scene boundaries."""
    scene1_words = [
        WordTiming(text="Scene", start=0.1, end=0.4),
        WordTiming(text="one", start=0.45, end=0.7),
    ]
    scene2_words = [
        WordTiming(text="Scene", start=1.0, end=1.3),
        WordTiming(text="two", start=1.35, end=1.6),
    ]

    ass_path = tmp_path / "scene_isolated.ass"
    generate_ass_subtitles([scene1_words, scene2_words], ass_path, words_per_line=3)

    content = ass_path.read_text(encoding="utf-8")
    lines = [line for line in content.splitlines() if line.startswith("Dialogue:")]
    # Scene 1 has 2 words, Scene 2 has 2 words.
    # If they were merged, with words_per_line=3, a line would contain "SCENE ONE SCENE".
    # Because they are scene-isolated, Scene 1 only has "SCENE ONE", Scene 2 only has "SCENE TWO".
    for line in lines:
        assert not ("ONE" in line and "TWO" in line), "Dialogue line straddles across scene boundary!"


def test_concatenate_audio_files(tmp_path: Path):
    """Verify FFmpeg audio concatenation creates valid playable audio."""
    from engine.tts_engine import concatenate_audio_files, synthesize_scene
    s1 = synthesize_scene(1, "First scene.", output_dir=tmp_path)
    s2 = synthesize_scene(2, "Second scene.", output_dir=tmp_path)

    out = tmp_path / "concat_master.mp3"
    concatenate_audio_files([s1.audio_path, s2.audio_path], out)

    assert out.exists()
    assert out.stat().st_size > 0

    import tempfile
    with tempfile.TemporaryDirectory() as td:
        p = Path(td)
        test_format_ass_time()
        test_generate_ass_subtitles(p)
        test_synthesize_script_end_to_end(p)
    print("All TTS tests passed successfully!")
