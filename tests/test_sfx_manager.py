"""Unit tests for SFX Foley Manager and audio mixing."""
from pathlib import Path
import subprocess
import shutil
import pytest

import imageio_ffmpeg
from engine.sfx_manager import get_sfx_path, mix_sfx_and_bgm, SFX_DIR
from engine.tts_engine import PositionedSFX


def test_sfx_path_resolution():
    """Verify SFX names and aliases resolve to existing physical MP3 files."""
    assert get_sfx_path("punch_heavy") is not None
    assert get_sfx_path("punch").name == "punch_heavy.mp3"
    assert get_sfx_path("flight_whoosh").name == "flight_whoosh.mp3"
    assert get_sfx_path("whoosh").name == "flight_whoosh.mp3"
    assert get_sfx_path("superman_takeoff").name == "superman_takeoff.mp3"
    assert get_sfx_path("superman").name == "superman_takeoff.mp3"
    assert get_sfx_path("glass_clink").name == "glass_clink.mp3"
    assert get_sfx_path("clink").name == "glass_clink.mp3"
    assert get_sfx_path("non_existent_sfx_name") is None


def test_mix_sfx_and_bgm_end_to_end(tmp_path):
    """Verify mix_sfx_and_bgm successfully mixes speech with adelay SFX and BGM."""
    ffmpeg_bin = shutil.which("ffmpeg") or imageio_ffmpeg.get_ffmpeg_exe()

    # Create dummy 3-second speech audio
    speech_path = tmp_path / "test_speech.mp3"
    cmd = [
        ffmpeg_bin, "-y",
        "-f", "lavfi",
        "-i", "aevalsrc='0.2*sin(2*PI*440*t)':s=44100",
        "-t", "3.0",
        "-c:a", "libmp3lame",
        str(speech_path)
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    # Position two SFX cues: punch at 0.5s and whoosh at 1.5s
    sfx_cues = [
        PositionedSFX(sound_effect="punch_heavy", timestamp_seconds=0.5, volume=1.2),
        PositionedSFX(sound_effect="flight_whoosh", timestamp_seconds=1.5, volume=1.0),
    ]

    output_mixed = tmp_path / "test_mixed.mp3"
    res = mix_sfx_and_bgm(
        speech_audio=speech_path,
        sfx_cues=sfx_cues,
        output_audio=output_mixed,
    )

    assert res.exists()
    assert res.stat().st_size > 5000
