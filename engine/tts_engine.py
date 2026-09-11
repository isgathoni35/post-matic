import asyncio
from dataclasses import dataclass, field
import logging
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import time
from typing import List, Optional, Union

# Ensure project root is on sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import edge_tts
import imageio_ffmpeg
from engine.config import TEMP_DIR
from engine.schema import (
    VideoScript,
    AnimatedStoryScript,
    Character,
    DialogueLine,
    StoryScene,
    SFXCue,
)


logger = logging.getLogger(__name__)

# Popular, expressive voices for viral short-form content
# Brian is the top-tier conversational male voice; Ava is the top-tier warm female voice
DEFAULT_VOICE = "en-US-BrianMultilingualNeural"
AVAILABLE_VOICES = {
    # Next-Gen V2 Expressive Multilingual Neural Voices (Most Human-Like)
    "brian": "en-US-BrianMultilingualNeural",      # Deep, conversational viral narrator (Male) - #1 Recommended
    "ava": "en-US-AvaMultilingualNeural",          # Warm, natural, expressive storyteller (Female)
    "andrew": "en-US-AndrewMultilingualNeural",    # Dynamic, punchy podcast host (Male)
    "emma": "en-US-EmmaMultilingualNeural",        # Friendly, clear, articulate (Female)
    # Classic Neural Voices
    "christopher": "en-US-ChristopherNeural",      # Authoritative, cinematic male
    "guy": "en-US-GuyNeural",                      # Energetic, dynamic male
    "eric": "en-US-EricNeural",                    # Friendly, articulate male
    "jenny": "en-US-JennyNeural",                  # Natural, clear female
    "sonia": "en-GB-SoniaNeural",                  # British narrative female
    "aria": "en-US-AriaNeural",                    # Confident, narrative female
    "michelle": "en-US-MichelleNeural",            # Professional female
}

# Voice-specific prosody presets to ensure natural human inflection and cadence
VOICE_PROSODY_PRESETS = {
    "en-US-BrianMultilingualNeural": {"rate": "-1%", "pitch": "-1Hz", "volume": "+0%"},  # Natural, conversational, deep
    "en-US-AvaMultilingualNeural":   {"rate": "+0%", "pitch": "+0Hz", "volume": "+0%"},  # Warm, authentic narrative
    "en-US-AndrewMultilingualNeural":{"rate": "+1%", "pitch": "+0Hz", "volume": "+0%"},  # Punchy, dynamic podcast style
    "en-US-EmmaMultilingualNeural":  {"rate": "-1%", "pitch": "+0Hz", "volume": "+0%"},  # Friendly, engaging storyteller
    "en-US-ChristopherNeural":       {"rate": "-4%", "pitch": "-2Hz", "volume": "+0%"},  # Cinematic, deliberate, deep
    "en-US-GuyNeural":               {"rate": "+2%", "pitch": "+0Hz", "volume": "+5%"},  # Energetic, modern hook
    "en-US-EricNeural":              {"rate": "-2%", "pitch": "-1Hz", "volume": "+0%"},  # Authoritative, articulate
    "en-US-JennyNeural":             {"rate": "+0%", "pitch": "+2Hz", "volume": "+0%"},  # Warm, conversational
    "en-GB-SoniaNeural":             {"rate": "-3%", "pitch": "-1Hz", "volume": "+0%"},  # Narrative storyteller
    "en-US-AriaNeural":              {"rate": "-2%", "pitch": "+1Hz", "volume": "+0%"},  # Confident, narrative
    "en-US-MichelleNeural":          {"rate": "-1%", "pitch": "+0Hz", "volume": "+0%"},  # Professional
}


def condition_narration_for_natural_speech(text: str) -> str:
    """Preprocess narration text so edge-tts synthesizes with natural human pauses and inflection.

    Transforms abrupt punctuation, introduces slight pauses at rhetorical breaks,
    and formats connectors to sound conversational rather than robotic.
    """
    if not text:
        return ""

    cleaned = text.strip()

    # Replace multiple hyphens or dashes with spaced em-dash for dramatic pause
    cleaned = re.sub(r"\s*--+\s*", " — ", cleaned)

    # If sentence ends with '?' and has more text immediately, ensure pause spacing
    cleaned = re.sub(r"\?(\s*)([A-Z])", r"? ... \2", cleaned)

    # Insert slight pause after introductory conversational phrases if comma missing
    intro_patterns = [
        r"^(Here's the thing|Here's the wild part|Think about this|Imagine this|Believe it or not|Guess what|The truth is|In fact)(?!\s*[,—\.\?])",
        r"\b(Here's the thing|Here's the wild part|Think about this|Imagine this|Believe it or not|Guess what|The truth is|In fact)(?!\s*[,—\.\?])",
    ]
    for pattern in intro_patterns:
        cleaned = re.sub(pattern, r"\1,", cleaned, flags=re.IGNORECASE)

    # Clean up duplicate spaces
    cleaned = re.sub(r"\s{2,}", " ", cleaned)

    return cleaned



def hex_to_ass_color(hex_str: str) -> str:
    """Convert a standard #RRGGBB or #RGB hex string to ASS &H00BBGGRR format."""
    clean = hex_str.strip().lstrip("#")
    if len(clean) == 3:
        clean = "".join([c * 2 for c in clean])
    if len(clean) != 6:
        return "&H00FFFFFF"  # Default white
    r = clean[0:2].upper()
    g = clean[2:4].upper()
    b = clean[4:6].upper()
    return f"&H00{b}{g}{r}"


@dataclass
class WordTiming:
    """Individual word timing in seconds with speaker and styling metadata."""
    text: str
    start: float
    end: float
    speaker_id: str = "narrator"
    speaker_name: str = "Narrator"
    color_hex: str = "#FFFFFF"

    @property
    def duration(self) -> float:
        return max(0.0, self.end - self.start)


@dataclass
class PositionedSFX:
    """Action sound effect cue placed at an absolute timestamp on the master timeline."""
    sound_effect: str
    timestamp_seconds: float
    volume: float = 1.0


@dataclass
class SceneAudioResult:
    """Audio synthesis result for a single scene."""
    scene_id: int
    audio_path: Path
    duration: float
    words: List[WordTiming] = field(default_factory=list)


@dataclass
class TTSResult:
    """Complete TTS result for an entire video script."""
    audio_path: Path
    subtitle_path: Path
    total_duration: float
    scene_results: List[SceneAudioResult] = field(default_factory=list)


@dataclass
class StoryTTSResult:
    """Result of multi-character story dialogue synthesis."""
    audio_path: Path
    subtitle_path: Path
    total_duration: float
    scene_durations: List[float]
    sfx_cues: List[PositionedSFX] = field(default_factory=list)


def get_audio_duration(file_path: Path, fallback_duration: float = 0.0) -> float:
    """Probe the exact decoded audio duration in seconds using FFmpeg."""
    if not file_path.exists():
        return fallback_duration

    try:
        ffmpeg_bin = shutil.which("ffmpeg") or imageio_ffmpeg.get_ffmpeg_exe()
        cmd = [ffmpeg_bin, "-i", str(file_path), "-f", "null", "-"]
        r = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

        # Match Duration line: "Duration: 00:00:04.25, start: ..."
        m = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.\d+)", r.stderr)
        if m:
            return int(m.group(1)) * 3600 + int(m.group(2)) * 60 + float(m.group(3))

        # Fallback to last time marker: "time=00:00:04.25"
        m2 = re.findall(r"time=(\d+):(\d+):(\d+\.\d+)", r.stderr)
        if m2:
            last = m2[-1]
            return int(last[0]) * 3600 + int(last[1]) * 60 + float(last[2])
    except Exception as err:
        logger.warning("Could not probe exact duration for %s: %s", file_path, err)

    return fallback_duration


def concatenate_audio_files(audio_files: List[Path], output_file: Path) -> Path:
    """Concatenate individual scene audio MP3s into a seamless master track via FFmpeg.

    Prevents raw byte stitching corruptions, clicks, and decoder drift.
    """
    output_file.parent.mkdir(parents=True, exist_ok=True)
    if not audio_files:
        raise ValueError("Cannot concatenate an empty list of audio files.")

    if len(audio_files) == 1:
        shutil.copyfile(audio_files[0], output_file)
        return output_file

    ffmpeg_bin = shutil.which("ffmpeg") or imageio_ffmpeg.get_ffmpeg_exe()
    timestamp = int(time.time() * 1000)
    list_file = output_file.parent / f"concat_audio_{timestamp}.txt"

    with open(list_file, "w", encoding="utf-8") as f:
        for p in audio_files:
            escaped = str(p.resolve()).replace("'", "'\\''")
            f.write(f"file '{escaped}'\n")

    cmd = [
        ffmpeg_bin,
        "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", str(list_file),
        "-c:a", "libmp3lame",
        "-q:a", "2",
        str(output_file),
    ]
    try:
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    except Exception as exc:
        logger.error("FFmpeg audio concatenation failed: %s", exc)
        raise
    finally:
        list_file.unlink(missing_ok=True)

    return output_file


def apply_studio_mastering(
    input_audio: Path,
    output_audio: Optional[Path] = None,
) -> Path:
    """Apply broadcast vocal mastering chain via FFmpeg to give voice natural warmth, body, and polish.

    Processing chain:
    1. highpass=f=80: Removes subsonic rumble & synthetic low-end buzz.
    2. equalizer=f=120: Adds warm chest resonance for a rich broadcast microphone feel.
    3. equalizer=f=3200: Elevates presence and speech articulation.
    4. equalizer=f=7500: De-ess harsh digital sibilance and metallic frequencies.
    5. compand: Studio dynamic range compression for smooth, controlled volume.
    6. loudnorm: EBU R128 broadcast loudness normalization (-16 LUFS).
    """
    dest_path = output_audio or input_audio.with_name(f"{input_audio.stem}_mastered{input_audio.suffix}")
    dest_path.parent.mkdir(parents=True, exist_ok=True)

    if not input_audio.exists():
        raise FileNotFoundError(f"Cannot master non-existent audio: {input_audio}")

    # Use a temporary intermediate if overwriting in place
    temp_dest = dest_path if dest_path.resolve() != input_audio.resolve() else dest_path.with_suffix(".temp.mp3")

    ffmpeg_bin = shutil.which("ffmpeg") or imageio_ffmpeg.get_ffmpeg_exe()
    filter_chain = (
        "highpass=f=80,"
        "equalizer=f=120:width_type=o:width=2:g=3.5,"
        "equalizer=f=3200:width_type=o:width=1.5:g=2.0,"
        "equalizer=f=7500:width_type=o:width=1.5:g=-2.5,"
        "compand=attacks=0.02:decays=0.1:points=-60/-60|-24/-18|-12/-8|0/-3:soft-knee=6,"
        "loudnorm=I=-16:LRA=7:TP=-1.5"
    )

    cmd = [
        ffmpeg_bin,
        "-y",
        "-i", str(input_audio),
        "-af", filter_chain,
        "-c:a", "libmp3lame",
        "-b:a", "192k",
        str(temp_dest),
    ]

    try:
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if temp_dest.resolve() != dest_path.resolve():
            os.replace(str(temp_dest), str(dest_path))
        return dest_path
    except Exception as exc:
        logger.warning("Studio audio mastering failed (falling back to unmastered audio): %s", exc)
        temp_dest.unlink(missing_ok=True)
        if dest_path.resolve() != input_audio.resolve():
            shutil.copyfile(input_audio, dest_path)
        return dest_path


def format_ass_time(seconds: float) -> str:
    """Format seconds into ASS subtitle timestamp: H:MM:SS.cc"""
    if seconds < 0:
        seconds = 0.0
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    centis = int(round((seconds - int(seconds)) * 100))
    if centis >= 100:
        secs += 1
        centis = 0
    return f"{hours}:{minutes:02d}:{secs:02d}.{centis:02d}"


def create_ass_header(
    font_name: str = "Arial Black",
    font_size: Optional[int] = None,
    primary_color: str = "&H00FFFFFF",    # Crisp White (ABGR)
    highlight_color: str = "&H0000FFFF",  # Bright Yellow (ABGR)
    outline_color: str = "&H00000000",    # Black (ABGR)
    back_color: str = "&H80000000",       # Semi-transparent black
    margin_v: Optional[int] = None,       # Safe zone clearance
    aspect_ratio: str = "9:16",
) -> str:
    """Generate ASS subtitle header and style definitions for 1080x1920 (short) or 1920x1080 (long) canvas."""
    if aspect_ratio == "16:9":
        play_res_x = 1920
        play_res_y = 1080
        effective_margin_v = margin_v if margin_v is not None else 120
        effective_font_size = font_size if font_size is not None else 62
    else:
        play_res_x = 1080
        play_res_y = 1920
        effective_margin_v = margin_v if margin_v is not None else 580
        effective_font_size = font_size if font_size is not None else 76

    return f"""[Script Info]
Title: PostMatic Subtitles
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.601
PlayResX: {play_res_x}
PlayResY: {play_res_y}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{font_name},{effective_font_size},{primary_color},&H000000FF,{outline_color},{back_color},-1,0,0,0,100,100,0,0,1,5,3,2,60,60,{effective_margin_v},1
Style: Highlight,{font_name},{effective_font_size},{highlight_color},&H000000FF,{outline_color},{back_color},-1,0,0,0,100,100,0,0,1,5,3,2,60,60,{effective_margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""


def generate_ass_subtitles(
    words: Union[List[WordTiming], List[List[WordTiming]]],
    output_file: Path,
    words_per_line: int = 3,
    font_name: str = "Arial Black",
    font_size: Optional[int] = None,
    highlight_color: str = "&H0000FFFF",  # Bright Yellow (ABGR)
    primary_color: str = "&H00FFFFFF",    # Crisp White (ABGR)
    margin_v: Optional[int] = None,
    aspect_ratio: str = "9:16",
) -> Path:
    """Generate animated, word-highlighted ASS subtitles with strict scene boundary isolation.

    Groups words into short phrases (2-4 words) strictly within each scene,
    preventing captions from straddling two distinct scenes across cuts.
    """
    if not words:
        output_file.write_text(create_ass_header(margin_v=margin_v, aspect_ratio=aspect_ratio), encoding="utf-8")
        return output_file

    lines = [create_ass_header(
        font_name=font_name,
        font_size=font_size,
        primary_color=primary_color,
        highlight_color=highlight_color,
        margin_v=margin_v,
        aspect_ratio=aspect_ratio,
    )]

    # Normalize input: support either flat list of WordTiming or list of scene word lists
    if isinstance(words[0], WordTiming):
        scenes_words_list: List[List[WordTiming]] = [words]  # type: ignore
    else:
        scenes_words_list = words  # type: ignore

    for scene_words in scenes_words_list:
        if not scene_words:
            continue

        # Group words strictly within THIS scene
        chunks = [scene_words[i:i + words_per_line] for i in range(0, len(scene_words), words_per_line)]

        for chunk in chunks:
            for active_idx, active_word in enumerate(chunk):
                start_str = format_ass_time(active_word.start)
                end_str = format_ass_time(active_word.end)

                formatted_words = []
                for idx, w in enumerate(chunk):
                    cleaned_text = w.text.strip().upper()
                    if idx == active_idx:
                        # Highlight active word in bright yellow with crisp white baseline
                        formatted_words.append(f"{{\\c{highlight_color}&}}{cleaned_text}{{\\c{primary_color}&}}")
                    else:
                        formatted_words.append(cleaned_text)

                line_text = " ".join(formatted_words)
                lines.append(f"Dialogue: 0,{start_str},{end_str},Default,,0,0,0,,{line_text}\n")

    output_file.parent.mkdir(parents=True, exist_ok=True)
    output_file.write_text("".join(lines), encoding="utf-8")
    return output_file


def generate_story_ass_subtitles(
    words: Union[List[WordTiming], List[List[WordTiming]]],
    output_file: Path,
    words_per_line: int = 3,
    font_name: str = "Arial Black",
    font_size: Optional[int] = None,
    highlight_color: str = "&H0000FFFF",  # Bright Yellow (ABGR)
    margin_v: Optional[int] = None,
    aspect_ratio: str = "9:16",
) -> Path:
    """Generate animated ASS subtitles with per-character color coding and active-word yellow pop."""
    if not words:
        output_file.write_text(create_ass_header(margin_v=margin_v, aspect_ratio=aspect_ratio), encoding="utf-8")
        return output_file

    lines = [create_ass_header(
        font_name=font_name,
        font_size=font_size,
        primary_color="&H00FFFFFF",
        highlight_color=highlight_color,
        margin_v=margin_v,
        aspect_ratio=aspect_ratio,
    )]

    if isinstance(words[0], WordTiming):
        scenes_words_list: List[List[WordTiming]] = [words]  # type: ignore
    else:
        scenes_words_list = words  # type: ignore

    for scene_words in scenes_words_list:
        if not scene_words:
            continue

        chunks = [scene_words[i:i + words_per_line] for i in range(0, len(scene_words), words_per_line)]

        for chunk in chunks:
            for active_idx, active_word in enumerate(chunk):
                start_str = format_ass_time(active_word.start)
                end_str = format_ass_time(active_word.end)

                formatted_words = []
                for idx, w in enumerate(chunk):
                    cleaned_text = w.text.strip().upper()
                    char_ass_color = hex_to_ass_color(w.color_hex)
                    if idx == active_idx:
                        # Active word highlighted in bright yellow, then returns to speaker's color
                        formatted_words.append(f"{{\\c{highlight_color}&}}{cleaned_text}{{\\c{char_ass_color}&}}")
                    else:
                        formatted_words.append(f"{{\\c{char_ass_color}&}}{cleaned_text}")

                line_text = " ".join(formatted_words)
                lines.append(f"Dialogue: 0,{start_str},{end_str},Default,,0,0,0,,{line_text}\n")

    output_file.parent.mkdir(parents=True, exist_ok=True)
    output_file.write_text("".join(lines), encoding="utf-8")
    return output_file


async def synthesize_speech_async(
    text: str,
    voice: str = DEFAULT_VOICE,
    rate: str = "+0%",
    volume: str = "+0%",
    pitch: str = "+0Hz",
    output_audio_path: Optional[Path] = None,
) -> tuple[bytes, List[WordTiming]]:
    """Synthesize speech using edge-tts and collect audio bytes and word timings."""
    communicate = edge_tts.Communicate(
        text=text,
        voice=voice,
        rate=rate,
        volume=volume,
        pitch=pitch,
        boundary="WordBoundary",
    )

    audio_chunks = []
    word_timings: List[WordTiming] = []

    async for chunk in communicate.stream():
        chunk_type = chunk.get("type")
        if chunk_type == "audio":
            audio_chunks.append(chunk["data"])
        elif chunk_type == "WordBoundary":
            # edge-tts offsets are in 100-nanosecond units (1e-7 seconds)
            offset_sec = chunk["offset"] / 10_000_000.0
            duration_sec = chunk["duration"] / 10_000_000.0
            word_text = chunk["text"]
            word_timings.append(
                WordTiming(
                    text=word_text,
                    start=offset_sec,
                    end=offset_sec + duration_sec,
                )
            )

    full_audio = b"".join(audio_chunks)

    if output_audio_path:
        output_audio_path.parent.mkdir(parents=True, exist_ok=True)
        output_audio_path.write_bytes(full_audio)

    return full_audio, word_timings


def synthesize_scene(
    scene_id: int,
    narration: str,
    voice: str = DEFAULT_VOICE,
    output_dir: Optional[Path] = None,
) -> SceneAudioResult:
    """Synthesize audio for a single scene with exact duration probing."""
    target_dir = output_dir or (TEMP_DIR / "tts")
    audio_path = target_dir / f"scene_{scene_id}.mp3"

    prosody = VOICE_PROSODY_PRESETS.get(voice, {"rate": "+0%", "pitch": "+0Hz", "volume": "+0%"})
    conditioned_text = condition_narration_for_natural_speech(narration)

    audio_bytes, words = asyncio.run(
        synthesize_speech_async(
            text=conditioned_text,
            voice=voice,
            rate=prosody["rate"],
            volume=prosody["volume"],
            pitch=prosody["pitch"],
            output_audio_path=audio_path,
        )
    )

    fallback_duration = words[-1].end if words else 0.0
    exact_duration = get_audio_duration(audio_path, fallback_duration=fallback_duration)

    return SceneAudioResult(
        scene_id=scene_id,
        audio_path=audio_path,
        duration=exact_duration,
        words=words,
    )


def synthesize_script(
    script: VideoScript,
    voice: str = DEFAULT_VOICE,
    output_dir: Optional[Path] = None,
    words_per_line: int = 3,
    aspect_ratio: str = "9:16",
) -> TTSResult:
    """Synthesize complete narration for all scenes in a VideoScript.

    Produces individual scene audio files, a concatenated master audio file via FFmpeg,
    and a fully synchronized ASS subtitle file with sample-accurate offsets.
    """
    target_dir = output_dir or (TEMP_DIR / "tts")
    target_dir.mkdir(parents=True, exist_ok=True)

    scenes_words_nested: List[List[WordTiming]] = []
    scene_audio_paths: List[Path] = []
    scene_results: List[SceneAudioResult] = []
    time_offset = 0.0

    prosody = VOICE_PROSODY_PRESETS.get(voice, {"rate": "+0%", "pitch": "+0Hz", "volume": "+0%"})

    for scene in script.scenes:
        scene_audio_path = target_dir / f"scene_{scene.scene_id}.mp3"
        conditioned_narration = condition_narration_for_natural_speech(scene.narration)
        audio_bytes, scene_words = asyncio.run(
            synthesize_speech_async(
                text=conditioned_narration,
                voice=voice,
                rate=prosody["rate"],
                volume=prosody["volume"],
                pitch=prosody["pitch"],
                output_audio_path=scene_audio_path,
            )
        )
        scene_audio_paths.append(scene_audio_path)

        # Probe exact audio duration from decoded file
        fallback_dur = scene_words[-1].end if scene_words else 0.0
        exact_duration = get_audio_duration(scene_audio_path, fallback_duration=fallback_dur)

        # Adjust word timings by cumulative time offset for the master subtitle track
        adjusted_words = []
        for w in scene_words:
            adjusted_words.append(
                WordTiming(
                    text=w.text,
                    start=w.start + time_offset,
                    end=w.end + time_offset,
                )
            )
        scenes_words_nested.append(adjusted_words)

        scene_results.append(
            SceneAudioResult(
                scene_id=scene.scene_id,
                audio_path=scene_audio_path,
                duration=exact_duration,
                words=scene_words,
            )
        )
        time_offset += exact_duration

    # Produce clean, pop-free master audio using FFmpeg concat
    raw_master_audio_path = target_dir / "narration_raw.mp3"
    concatenate_audio_files(scene_audio_paths, raw_master_audio_path)

    # Apply broadcast vocal mastering to add warmth, clarity, and EBU R128 loudness
    master_audio_path = target_dir / "narration_master.mp3"
    apply_studio_mastering(raw_master_audio_path, master_audio_path)

    # Master ASS subtitles with scene boundary isolation
    master_sub_path = target_dir / "subtitles.ass"
    generate_ass_subtitles(
        words=scenes_words_nested,
        output_file=master_sub_path,
        words_per_line=words_per_line,
        aspect_ratio=aspect_ratio,
    )

    total_duration = get_audio_duration(master_audio_path, fallback_duration=time_offset)

    return TTSResult(
        audio_path=master_audio_path,
        subtitle_path=master_sub_path,
        total_duration=total_duration,
        scene_results=scene_results,
    )


def synthesize_story_dialogue(
    story: AnimatedStoryScript,
    output_dir: Optional[Path] = None,
    words_per_line: int = 3,
    aspect_ratio: str = "9:16",
) -> StoryTTSResult:
    """Synthesize multi-character dialogue for an AnimatedStoryScript.

    Sequentially routes each dialogue line to its character's assigned voice,
    adjusts pitch and rate, probes exact line durations, tracks positioned SFX cues,
    concatenates into scene and master audio tracks, applies broadcast vocal mastering,
    and creates character-colored animated ASS subtitles.
    """
    target_dir = output_dir or (TEMP_DIR / "tts_story")
    target_dir.mkdir(parents=True, exist_ok=True)

    cast: dict[str, Character] = {char.id: char for char in story.characters}
    default_char = Character(
        id="narrator",
        name="Narrator",
        voice=DEFAULT_VOICE,
        pitch="+0Hz",
        rate="+0%",
        visual_dna="Omniscient narrator",
        subtitle_color="#FFFFFF",
    )

    all_scenes_words: List[List[WordTiming]] = []
    scene_audio_paths: List[Path] = []
    scene_durations: List[float] = []
    all_sfx_cues: List[PositionedSFX] = []

    global_time = 0.0

    for scene in story.scenes:
        scene_dialogue_audios: List[Path] = []
        scene_words_accum: List[WordTiming] = []
        scene_start_time = global_time

        for line in scene.dialogue:
            char = cast.get(line.speaker_id, default_char)
            voice = char.voice or DEFAULT_VOICE
            rate = char.rate or "+0%"
            pitch = char.pitch or "+0Hz"

            line_audio_path = target_dir / f"scene_{scene.scene_id}_line_{line.line_id}.mp3"
            conditioned_text = condition_narration_for_natural_speech(line.text)

            _, line_words = asyncio.run(
                synthesize_speech_async(
                    text=conditioned_text,
                    voice=voice,
                    rate=rate,
                    volume="+0%",
                    pitch=pitch,
                    output_audio_path=line_audio_path,
                )
            )

            fallback_dur = line_words[-1].end if line_words else 1.0
            line_duration = get_audio_duration(line_audio_path, fallback_duration=fallback_dur)

            # Register action SFX cues relative to line start on global timeline
            for cue in line.sfx:
                sfx_timestamp = global_time + max(0.0, cue.offset_seconds)
                all_sfx_cues.append(
                    PositionedSFX(
                        sound_effect=cue.sound_effect,
                        timestamp_seconds=sfx_timestamp,
                        volume=cue.volume,
                    )
                )

            # Adjust word timings to global timeline with speaker color metadata
            for w in line_words:
                scene_words_accum.append(
                    WordTiming(
                        text=w.text,
                        start=w.start + global_time,
                        end=w.end + global_time,
                        speaker_id=char.id,
                        speaker_name=char.name,
                        color_hex=char.subtitle_color,
                    )
                )

            scene_dialogue_audios.append(line_audio_path)
            # Add a slight natural conversational pause between dialogue lines (150ms)
            global_time += line_duration + 0.15

        # Concatenate dialogue lines into a unified scene audio track
        scene_master_audio = target_dir / f"scene_{scene.scene_id}_audio.mp3"
        concatenate_audio_files(scene_dialogue_audios, scene_master_audio)
        scene_audio_paths.append(scene_master_audio)

        scene_total_dur = global_time - scene_start_time
        scene_durations.append(scene_total_dur)
        all_scenes_words.append(scene_words_accum)

    # Concatenate all scenes into story raw master
    raw_story_audio = target_dir / "story_narration_raw.mp3"
    concatenate_audio_files(scene_audio_paths, raw_story_audio)

    # Master the dialogue audio track with broadcast EQ and loudness normalization
    master_story_audio = target_dir / "story_narration_master.mp3"
    apply_studio_mastering(raw_story_audio, master_story_audio)

    # Generate multi-character animated ASS subtitles
    master_sub_path = target_dir / "story_subtitles.ass"
    generate_story_ass_subtitles(
        words=all_scenes_words,
        output_file=master_sub_path,
        words_per_line=words_per_line,
        aspect_ratio=aspect_ratio,
    )

    total_duration = get_audio_duration(master_story_audio, fallback_duration=global_time)

    return StoryTTSResult(
        audio_path=master_story_audio,
        subtitle_path=master_sub_path,
        total_duration=total_duration,
        scene_durations=scene_durations,
        sfx_cues=all_sfx_cues,
    )


if __name__ == "__main__":
    from engine.schema import Scene
    print("Testing edge-tts voice synthesis & ASS subtitle generation...")
    test_script = VideoScript(
        title="Test Volcano Video",
        description="Testing TTS & subtitle timing",
        tags=["volcano", "test"],
        scenes=[
            Scene(
                scene_id=1,
                narration="Did you know volcanoes can actually create their own lightning?",
                visual_description="Volcano erupting at night",
                search_keywords=["volcano lightning"],
            ),
            Scene(
                scene_id=2,
                narration="Millions of colliding ash particles generate huge static charges.",
                visual_description="Ash cloud close up",
                search_keywords=["volcanic ash"],
            ),
        ],
    )

    result = synthesize_script(test_script)
    print("\n=== TTS SYNTHESIS COMPLETE ===")
    print(f"Audio Path:     {result.audio_path} ({result.audio_path.stat().st_size} bytes)")
    print(f"Subtitle Path:  {result.subtitle_path} ({result.subtitle_path.stat().st_size} bytes)")
    print(f"Total Duration: {result.total_duration:.2f}s")
    for s in result.scene_results:
        print(f"  Scene {s.scene_id}: {s.duration:.2f}s ({len(s.words)} words)")
    print("\n=== ASS SUBTITLE PREVIEW ===")
    print(result.subtitle_path.read_text(encoding="utf-8")[:600])
