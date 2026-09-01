"""Voice synthesis and ASS subtitle generation using edge-tts."""
import asyncio
from dataclasses import dataclass, field
import logging
from pathlib import Path
import sys
from typing import List, Optional

# Ensure project root is on sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import edge_tts
from engine.config import TEMP_DIR
from engine.schema import VideoScript


logger = logging.getLogger(__name__)

# Popular, expressive voices for viral short-form content
DEFAULT_VOICE = "en-US-ChristopherNeural"
AVAILABLE_VOICES = {
    "christopher": "en-US-ChristopherNeural",  # Authoritative, deep, engaging male
    "guy": "en-US-GuyNeural",                  # Energetic, dynamic male
    "eric": "en-US-EricNeural",                # Friendly, articulate male
    "jenny": "en-US-JennyNeural",              # Natural, clear female
    "aria": "en-US-AriaNeural",                # Confident, narrative female
    "michelle": "en-US-MichelleNeural",        # Professional female
}


@dataclass
class WordTiming:
    """Individual word timing in seconds."""
    text: str
    start: float
    end: float

    @property
    def duration(self) -> float:
        return max(0.0, self.end - self.start)


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
    font_size: int = 72,
    primary_color: str = "&H00FFFFFF",    # White (ABGR)
    highlight_color: str = "&H0000FFFF",  # Yellow (ABGR)
    outline_color: str = "&H00000000",    # Black (ABGR)
    back_color: str = "&H80000000",       # Semi-transparent black
    margin_v: int = 500,                  # Vertical margin from bottom
) -> str:
    """Generate ASS subtitle header and style definitions for 1080x1920 canvas."""
    return f"""[Script Info]
Title: PostMatic Subtitles
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.601
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{font_name},{font_size},{primary_color},&H000000FF,{outline_color},{back_color},-1,0,0,0,100,100,0,0,1,6,3,2,60,60,{margin_v},1
Style: Highlight,{font_name},{font_size},{highlight_color},&H000000FF,{outline_color},{back_color},-1,0,0,0,100,100,0,0,1,6,3,2,60,60,{margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""


def generate_ass_subtitles(
    words: List[WordTiming],
    output_file: Path,
    words_per_line: int = 3,
    font_name: str = "Arial Black",
    font_size: int = 72,
    highlight_color: str = "&H0000FFFF",  # Bright Yellow (ABGR)
    primary_color: str = "&H00FFFFFF",    # Crisp White (ABGR)
    margin_v: int = 500,
) -> Path:
    """Generate animated, word-highlighted ASS subtitles from word timings.

    Groups words into short phrases (2-4 words) and highlights the currently
    spoken word in real-time for high-engagement dynamic captions.
    """
    if not words:
        output_file.write_text(create_ass_header(), encoding="utf-8")
        return output_file

    lines = [create_ass_header(
        font_name=font_name,
        font_size=font_size,
        primary_color=primary_color,
        highlight_color=highlight_color,
        margin_v=margin_v,
    )]

    # Group words into chunks of `words_per_line`
    chunks = [words[i:i + words_per_line] for i in range(0, len(words), words_per_line)]

    for chunk in chunks:
        for active_idx, active_word in enumerate(chunk):
            start_str = format_ass_time(active_word.start)
            end_str = format_ass_time(active_word.end)

            # Build formatted chunk text with active word highlighted
            formatted_words = []
            for idx, w in enumerate(chunk):
                cleaned_text = w.text.strip().upper()
                if idx == active_idx:
                    # Highlight active word with highlight color and slight pop
                    formatted_words.append(f"{{\\c{highlight_color}&}}{cleaned_text}{{\\c{primary_color}&}}")
                else:
                    formatted_words.append(cleaned_text)

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
    """Synthesize audio for a single scene."""
    target_dir = output_dir or (TEMP_DIR / "tts")
    audio_path = target_dir / f"scene_{scene_id}.mp3"

    audio_bytes, words = asyncio.run(
        synthesize_speech_async(
            text=narration,
            voice=voice,
            output_audio_path=audio_path,
        )
    )

    duration = words[-1].end if words else 0.0
    return SceneAudioResult(
        scene_id=scene_id,
        audio_path=audio_path,
        duration=duration,
        words=words,
    )


def synthesize_script(
    script: VideoScript,
    voice: str = DEFAULT_VOICE,
    output_dir: Optional[Path] = None,
    words_per_line: int = 3,
) -> TTSResult:
    """Synthesize complete narration for all scenes in a VideoScript.

    Produces individual scene audio files, a concatenated full audio file,
    and a fully synchronized ASS subtitle file with word-level highlight animations.
    """
    target_dir = output_dir or (TEMP_DIR / "tts")
    target_dir.mkdir(parents=True, exist_ok=True)

    all_words: List[WordTiming] = []
    scene_results: List[SceneAudioResult] = []
    full_audio_bytes = bytearray()
    time_offset = 0.0

    for scene in script.scenes:
        scene_audio_path = target_dir / f"scene_{scene.scene_id}.mp3"
        audio_bytes, scene_words = asyncio.run(
            synthesize_speech_async(
                text=scene.narration,
                voice=voice,
                output_audio_path=scene_audio_path,
            )
        )

        full_audio_bytes.extend(audio_bytes)
        scene_duration = scene_words[-1].end if scene_words else 0.0

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
        all_words.extend(adjusted_words)

        scene_results.append(
            SceneAudioResult(
                scene_id=scene.scene_id,
                audio_path=scene_audio_path,
                duration=scene_duration,
                words=scene_words,
            )
        )
        time_offset += scene_duration

    # Write master audio file
    master_audio_path = target_dir / "narration_master.mp3"
    master_audio_path.write_bytes(full_audio_bytes)

    # Write master ASS subtitle file
    master_sub_path = target_dir / "subtitles.ass"
    generate_ass_subtitles(
        words=all_words,
        output_file=master_sub_path,
        words_per_line=words_per_line,
    )

    total_duration = all_words[-1].end if all_words else 0.0

    return TTSResult(
        audio_path=master_audio_path,
        subtitle_path=master_sub_path,
        total_duration=total_duration,
        scene_results=scene_results,
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
