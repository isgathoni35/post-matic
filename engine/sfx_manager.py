"""Sound Effects (SFX) and Foley management module."""
import logging
import os
from pathlib import Path
import shutil
import subprocess
import sys
from typing import List, Optional, Union

# Ensure project root is on sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import imageio_ffmpeg
from engine.tts_engine import PositionedSFX

logger = logging.getLogger(__name__)

SFX_DIR = PROJECT_ROOT / "assets" / "audio" / "sfx"

# Comprehensive alias map allowing natural LLM cues to map to exact audio files
SFX_ALIASES = {
    # Combat
    "punch": "punch_heavy.mp3",
    "punch_heavy": "punch_heavy.mp3",
    "hit": "punch_heavy.mp3",
    "punch_light": "punch_light.mp3",
    "slap": "punch_light.mp3",
    "body_slam": "punch_heavy.mp3",
    "sword": "sword_clash.mp3",
    "sword_clash": "sword_clash.mp3",
    "blade": "sword_clash.mp3",
    # Superhero & Movement
    "whoosh": "flight_whoosh.mp3",
    "flight_whoosh": "flight_whoosh.mp3",
    "flight": "flight_whoosh.mp3",
    "superman": "superman_takeoff.mp3",
    "superman_whoosh": "superman_takeoff.mp3",
    "superman_takeoff": "superman_takeoff.mp3",
    "takeoff": "superman_takeoff.mp3",
    "sonic_boom": "sonic_boom.mp3",
    "boom": "sonic_boom.mp3",
    "teleport": "teleport_zap.mp3",
    "teleport_zap": "teleport_zap.mp3",
    "zap": "teleport_zap.mp3",
    # Foley & Comedy
    "glass": "glass_clink.mp3",
    "glass_clink": "glass_clink.mp3",
    "clink": "glass_clink.mp3",
    "door": "door_slam.mp3",
    "door_slam": "door_slam.mp3",
    "slam": "door_slam.mp3",
    "scratch": "record_scratch.mp3",
    "record_scratch": "record_scratch.mp3",
    "explosion": "explosion_cinematic.mp3",
    "explosion_cinematic": "explosion_cinematic.mp3",
    "anime_powerup": "anime_powerup.mp3",
    "powerup": "anime_powerup.mp3",
    "aura": "anime_powerup.mp3",
}


def get_sfx_path(effect_name: str) -> Optional[Path]:
    """Resolve an effect name or alias to a physical audio file in the SFX bank."""
    normalized = effect_name.strip().lower().replace(" ", "_").replace("-", "_")
    filename = SFX_ALIASES.get(normalized)
    if not filename:
        # Check if direct file exists with mp3 or wav extension
        direct_path = SFX_DIR / f"{normalized}.mp3"
        if direct_path.exists():
            return direct_path
        direct_wav = SFX_DIR / f"{normalized}.wav"
        if direct_wav.exists():
            return direct_wav
        return None

    path = SFX_DIR / filename
    return path if path.exists() else None


def mix_sfx_and_bgm(
    speech_audio: Path,
    sfx_cues: List[PositionedSFX],
    output_audio: Path,
    bgm_path: Optional[Union[Path, str]] = None,
    bgm_volume: float = 0.08,
) -> Path:
    """Mix speech narration with sample-accurate action SFX and ducked background music."""
    output_audio.parent.mkdir(parents=True, exist_ok=True)
    ffmpeg_bin = shutil.which("ffmpeg") or imageio_ffmpeg.get_ffmpeg_exe()

    valid_cues = []
    for cue in sfx_cues:
        p = get_sfx_path(cue.sound_effect)
        if p and p.exists():
            valid_cues.append((p, cue))
        else:
            logger.warning("Sound effect '%s' could not be resolved; skipping cue.", cue.sound_effect)

    has_bgm = bgm_path is not None and Path(bgm_path).exists()

    # If no SFX and no BGM, simply copy speech audio
    if not valid_cues and not has_bgm:
        shutil.copyfile(speech_audio, output_audio)
        return output_audio

    cmd = [ffmpeg_bin, "-y", "-i", str(speech_audio)]
    filter_parts = []
    mix_inputs = ["[0:a]"]

    # Add each SFX track
    for idx, (sfx_file, cue) in enumerate(valid_cues, start=1):
        cmd.extend(["-i", str(sfx_file)])
        delay_ms = max(0, int(cue.timestamp_seconds * 1000))
        vol = max(0.1, min(cue.volume, 2.5))
        filter_parts.append(
            f"[{idx}:a]adelay={delay_ms}|{delay_ms},volume={vol:.2f}[sfx_{idx}]"
        )
        mix_inputs.append(f"[sfx_{idx}]")

    # Add BGM if present
    if has_bgm:
        bgm_input_idx = len(valid_cues) + 1
        cmd.extend(["-stream_loop", "-1", "-i", str(bgm_path)])
        filter_parts.append(
            f"[{bgm_input_idx}:a]volume={bgm_volume},afade=t=in:ss=0:d=1[bgm]"
        )
        mix_inputs.append("[bgm]")

    # Mix all audio streams together
    mix_str = "".join(mix_inputs)
    total_inputs = len(mix_inputs)
    filter_parts.append(
        f"{mix_str}amix=inputs={total_inputs}:duration=first:dropout_transition=2[aout]"
    )

    cmd.extend([
        "-filter_complex", ";".join(filter_parts),
        "-map", "[aout]",
        "-c:a", "libmp3lame",
        "-b:a", "192k",
        str(output_audio),
    ])

    try:
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return output_audio
    except subprocess.CalledProcessError as exc:
        logger.error("FFmpeg SFX audio mixing failed: %s", exc)
        # Fallback to pure speech audio
        shutil.copyfile(speech_audio, output_audio)
        return output_audio
