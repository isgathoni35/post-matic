"""Master End-to-End Video Generation Pipeline."""
from dataclasses import dataclass
import logging
from pathlib import Path
import shutil
import sys
import time
from typing import Any, Callable, Dict, List, Optional, Union

# Ensure project root is on sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from engine.config import OUTPUT_DIR, TEMP_DIR
from engine.media_downloader import DownloadedVideo, fetch_script_media
from engine.schema import VideoScript, AnimatedStoryScript
from engine.script_generator import generate_script, generate_story_script
from engine.tts_engine import (
    DEFAULT_VOICE,
    TTSResult,
    synthesize_script,
    StoryTTSResult,
    synthesize_story_dialogue,
)
from engine.video_renderer import (
    render_video,
    image_to_ken_burns_clip,
    concatenate_clips,
    burn_audio_and_subtitles,
)
from engine.image_generator import generate_story_scene_image
from engine.sfx_manager import mix_sfx_and_bgm
from engine.character_manager import prepare_characters

logger = logging.getLogger(__name__)


def cleanup_temp_dir() -> None:
    """Safely cleans up intermediate cached media and audio clips from TEMP_DIR."""
    try:
        if TEMP_DIR.exists():
            for item in TEMP_DIR.iterdir():
                if item.is_file():
                    item.unlink(missing_ok=True)
                elif item.is_dir():
                    shutil.rmtree(item, ignore_errors=True)
            logger.info("Temporary render files cleaned up successfully.")
    except Exception as e:
        logger.warning("Could not clean temp directory: %s", e)


@dataclass
class VideoGenerationResult:
    """Complete output payload from the end-to-end video pipeline."""
    video_path: Path
    script: VideoScript
    tts_result: TTSResult
    downloaded_videos: List[DownloadedVideo]
    duration_seconds: float
    file_size_bytes: int
    elapsed_time_seconds: float


ProgressCallback = Callable[[str, int, Optional[dict]], None]


def generate_faceless_video(
    topic: str,
    target_duration: int = 30,
    target_scenes: Optional[int] = None,
    voice: str = DEFAULT_VOICE,
    video_format: str = "short",
    output_path: Optional[Path] = None,
    gemini_api_key: Optional[str] = None,
    pexels_api_key: Optional[str] = None,
    preferred_model: Optional[str] = None,
    words_per_subtitle_line: int = 3,
    bgm_path: Optional[Union[Path, str, bool]] = None,
    cleanup_temp: bool = True,
    progress_callback: Optional[ProgressCallback] = None,
) -> VideoGenerationResult:
    """Execute the entire 5-stage automated video generation pipeline.

    Stages:
    1. Script Generation (Gemini LLM)
    2. Voice Synthesis & Word Timings & ASS Subtitle Creation (edge-tts)
    3. Video Asset Sourcing & Downloading (Pexels API + Imagen 3)
    4. Programmatic FFmpeg Assembly, Normalization, & Libass Caption Burning
    5. Result Validation & Packaging
    """
    start_time = time.time()
    aspect_ratio = "16:9" if video_format == "long" else "9:16"
    logger.info("Starting automated video generation for topic: '%s' (format: %s, aspect: %s)", topic, video_format, aspect_ratio)

    def report_progress(status: str, pct: int, script_data: Optional[dict] = None):
        if progress_callback:
            try:
                progress_callback(status, pct, script_data)
            except Exception as cb_err:
                logger.warning("Progress callback failed: %s", cb_err)

    # 1. Generate Script
    report_progress("scripting", 15)
    print(f"\n[1/4] Generating script for topic: '{topic}'...")
    script = generate_script(
        topic=topic,
        target_duration=target_duration,
        target_scenes=target_scenes,
        api_key=gemini_api_key,
        preferred_model=preferred_model,
    )
    print(f"      Title: \"{script.title}\" ({len(script.scenes)} scenes)")
    report_progress("scripting", 25, script.model_dump())

    # 2. Voice Synthesis & Subtitles
    report_progress("synthesizing", 35)
    print(f"\n[2/4] Synthesizing voiceover with voice '{voice}' and generating ASS subtitles ({aspect_ratio})...")
    tts_result = synthesize_script(
        script=script,
        voice=voice,
        words_per_line=words_per_subtitle_line,
        aspect_ratio=aspect_ratio,
    )
    print(f"      Audio duration: {tts_result.total_duration:.2f}s")
    report_progress("synthesizing", 50)

    # Map scene durations from audio
    scene_durations = {
        s.scene_id: s.duration for s in tts_result.scene_results
    }

    # 3. Media Sourcing
    report_progress("sourcing_media", 60)
    print(f"\n[3/4] Sourcing video clips (Pexels Stock + Google Imagen 3 AI Fallback, format: {video_format})...", flush=True)
    downloaded_videos = fetch_script_media(
        script=script,
        scene_durations=scene_durations,
        api_key=pexels_api_key,
        gemini_api_key=gemini_api_key,
        video_format=video_format,
    )
    report_progress("sourcing_media", 75)

    # 4. Assembly & Subtitle Burning
    report_progress("rendering", 85)
    timestamp_slug = int(time.time())
    dest_output = output_path or (OUTPUT_DIR / f"video_{timestamp_slug}.mp4")

    print(f"\n[4/4] Assembling video, normalizing to {aspect_ratio}, and burning animated captions with FFmpeg...")
    final_video = render_video(
        downloaded_videos=downloaded_videos,
        tts_result=tts_result,
        output_path=dest_output,
        video_format=video_format,
        bgm_path=bgm_path,
    )
    report_progress("rendering", 95)

    elapsed = time.time() - start_time
    file_size = final_video.stat().st_size

    print(f"\n=======================================================")
    print(f" SUCCESS! Video successfully generated in {elapsed:.1f}s")
    print(f" File:     {final_video}")
    print(f" Size:     {file_size / (1024 * 1024):.2f} MB")
    print(f" Duration: {tts_result.total_duration:.2f}s")
    print(f" Title:    {script.title}")
    print(f" Tags:     {', '.join(script.tags)}")
    print(f"=======================================================\n")

    if cleanup_temp:
        cleanup_temp_dir()

    return VideoGenerationResult(
        video_path=final_video,
        script=script,
        tts_result=tts_result,
        downloaded_videos=downloaded_videos,
        duration_seconds=tts_result.total_duration,
        file_size_bytes=file_size,
        elapsed_time_seconds=elapsed,
    )


def create_fallback_story_frame(scene_id: int, style: str, output_path: Path) -> Path:
    """Create a high-contrast themed stylized procedural frame if external AI is temporarily offline."""
    import subprocess
    import shutil
    import imageio_ffmpeg

    ffmpeg_bin = shutil.which("ffmpeg") or imageio_ffmpeg.get_ffmpeg_exe()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    style_clean = style.lower().strip()
    if style_clean == "stickman":
        # Draw dynamic neon stick figure martial artist using procedural geometry
        # Alternate poses based on scene_id
        shift = (scene_id % 3) * 60
        vf = (
            f"drawbox=x={480+shift}:y=480:w=120:h=120:color=0x38BDF8:t=fill,"  # Head
            f"drawbox=x={530+shift}:y=600:w=20:h=320:color=0x38BDF8:t=fill,"   # Torso
            f"drawbox=x={410+shift}:y=680:w=260:h=20:color=0x38BDF8:t=fill,"   # Arms (Punch pose)
            f"drawbox=x={480+shift}:y=920:w=20:h=260:color=0x38BDF8:t=fill,"   # Left Leg
            f"drawbox=x={580+shift}:y=920:w=20:h=260:color=0x38BDF8:t=fill,"   # Right Leg
            f"drawbox=x=0:y=1180:w=1080:h=6:color=0x22C55E@0.5:t=fill"          # Neon Ground Plane
        )
        bg_color = "0x09090e"
    elif style_clean == "anime":
        # Anime speed lines & cinematic dark aesthetic
        vf = (
            "drawbox=x=100:y=0:w=6:h=1920:color=0x6366F1@0.4:t=fill,"
            "drawbox=x=980:y=0:w=6:h=1920:color=0x6366F1@0.4:t=fill,"
            "drawbox=x=0:y=940:w=1080:h=40:color=0xA855F7@0.3:t=fill"
        )
        bg_color = "0x0f0e17"
    else:
        color_map = {
            "donghua": "0x0b132b",
            "3d_cartoon": "0x1c1917",
        }
        bg_color = color_map.get(style_clean, "0x111118")
        vf = "drawbox=x=0:y=960:w=1080:h=8:color=0x6366F1@0.3:t=fill"

    cmd = [
        ffmpeg_bin, "-y",
        "-f", "lavfi",
        "-i", f"color=c={bg_color}:s=1080x1920:d=1",
        "-vf", vf,
        "-frames:v", "1",
        str(output_path),
    ]
    try:
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    except Exception as e:
        logger.warning("Procedural fallback frame generation error: %s", e)
    return output_path


@dataclass
class StoryGenerationResult:
    """Complete output payload from the animated story pipeline."""
    video_path: Path
    script: AnimatedStoryScript
    tts_result: StoryTTSResult
    duration_seconds: float
    file_size_bytes: int
    elapsed_time_seconds: float


def generate_animated_story_video(
    topic: str,
    style: str = "anime",
    target_duration: int = 25,
    target_scenes: Optional[int] = None,
    custom_characters: Optional[List[Any]] = None,
    output_path: Optional[Path] = None,
    gemini_api_key: Optional[str] = None,
    preferred_model: Optional[str] = None,
    words_per_subtitle_line: int = 3,
    bgm_path: Optional[Union[Path, str]] = None,
    cleanup_temp: bool = False,
    progress_callback: Optional[ProgressCallback] = None,
    series_context: Optional[str] = None,
) -> StoryGenerationResult:
    """Execute the end-to-end multi-character animated story video generation pipeline.

    Stages:
    1. Screenplay Generation with Cast & Action SFX Cues (Gemini LLM)
    2. Multi-Voice Dialogue Synthesis & Speaker-Colored Subtitles (edge-tts)
    3. Action SFX & Foley Audio Mixing with Ducked BGM (FFmpeg adelay/amix)
    4. Style-Consistent Visual Generation with Character Visual DNA (Google Imagen 3)
    5. Dynamic 2.5D Camera Motion (Fight Shakes, Flight Pans, Zooms) & Final Assembly
    """
    start_time = time.time()
    logger.info("Starting animated story generation: '%s' (Style: %s, Target Duration: %ds)", topic, style, target_duration)

    def report_progress(status: str, pct: int, payload: Optional[dict] = None):
        if progress_callback:
            try:
                progress_callback(status, pct, payload)
            except Exception as cb_err:
                logger.warning("Progress callback failed: %s", cb_err)

    # 0. Custom Character Preparation & Visual DNA Extraction
    resolved_characters = []
    if custom_characters:
        report_progress("character_prep", 10)
        resolved_characters = prepare_characters(custom_characters, api_key=gemini_api_key)
        logger.info("Resolved %d custom characters with visual DNA.", len(resolved_characters))

    # 1. Screenplay Generation
    report_progress("scripting", 15)
    print(f"\n[1/5] Directing multi-character screenplay for: '{topic}' (Style: {style})...")
    story = generate_story_script(
        topic=topic,
        style=style,
        target_duration=target_duration,
        target_scenes=target_scenes,
        custom_characters=resolved_characters if resolved_characters else None,
        api_key=gemini_api_key,
        preferred_model=preferred_model,
        series_context=series_context,
    )
    print(f"      Title: \"{story.title}\"")
    print(f"      Cast:  {', '.join([c.name for c in story.characters])} ({len(story.scenes)} scenes)")
    report_progress("scripting", 25, story.model_dump())

    # 2. Multi-Voice Dialogue Synthesis & Speaker Subtitles
    report_progress("synthesizing", 35)
    print("\n[2/5] Synthesizing multi-character dialogue and speaker-colored subtitles...")
    tts_result = synthesize_story_dialogue(
        story=story,
        words_per_line=words_per_subtitle_line,
        aspect_ratio="9:16",
    )
    print(f"      Spoken dialogue duration: {tts_result.total_duration:.2f}s ({len(tts_result.sfx_cues)} SFX cues)")
    report_progress("synthesizing", 50)

    # 3. Action SFX & Foley Mixing
    report_progress("foley_mixing", 55)
    print(f"\n[3/5] Mixing {len(tts_result.sfx_cues)} action sound effects (whooshes, punches, impacts)...")
    story_audio_dir = TEMP_DIR / "tts_story"
    story_audio_dir.mkdir(parents=True, exist_ok=True)
    foley_mixed_audio = story_audio_dir / "story_foley_master.mp3"

    mix_sfx_and_bgm(
        speech_audio=tts_result.audio_path,
        sfx_cues=tts_result.sfx_cues,
        output_audio=foley_mixed_audio,
        bgm_path=bgm_path,
    )
    report_progress("foley_mixing", 65)

    # 4. Style-Anchored Visual Generation
    report_progress("sourcing_visuals", 70)
    print(f"\n[4/5] Generating style-anchored keyframes ({style})...")
    cast_map = {c.id: c for c in story.characters}
    scene_clips: List[Path] = []
    render_temp_dir = TEMP_DIR / "story_render"
    render_temp_dir.mkdir(parents=True, exist_ok=True)

    for idx, scene in enumerate(story.scenes):
        scene_dur = tts_result.scene_durations[idx] if idx < len(tts_result.scene_durations) else 4.0
        # Determine characters present in this scene
        present_char_ids = {line.speaker_id for line in scene.dialogue}
        char_dna_list = [cast_map[cid].visual_dna for cid in present_char_ids if cid in cast_map]

        scene_image = generate_story_scene_image(
            scene_id=scene.scene_id,
            visual_description=scene.visual_description,
            environment_anchor=scene.environment_anchor,
            character_dna_list=char_dna_list,
            style=style,
            api_key=gemini_api_key,
        )

        if not scene_image or not scene_image.exists():
            fallback_path = render_temp_dir / f"fallback_scene_{scene.scene_id}.jpg"
            scene_image = create_fallback_story_frame(scene.scene_id, style, fallback_path)

        # 5. Dynamic 2.5D Camera Motion (Fight Shakes, Flight Pans, Zooms)
        scene_clip_path = render_temp_dir / f"scene_{scene.scene_id}_clip.mp4"
        image_to_ken_burns_clip(
            image_path=scene_image,
            target_duration=scene_dur,
            output_path=scene_clip_path,
            camera_movement=scene.camera_movement,
        )
        scene_clips.append(scene_clip_path)

    report_progress("rendering", 85)

    # Concatenate all visual scene clips
    concatenated_video = render_temp_dir / "story_concatenated.mp4"
    concatenate_clips(scene_clips, concatenated_video)

    # Burn final audio and speaker-colored subtitles
    timestamp_slug = int(time.time())
    dest_output = output_path or (OUTPUT_DIR / f"story_{style}_{timestamp_slug}.mp4")

    print("\n[5/5] Burning character-colored ASS subtitles & Foley audio...")
    final_video = burn_audio_and_subtitles(
        video_track_path=concatenated_video,
        audio_path=foley_mixed_audio,
        subtitle_path=tts_result.subtitle_path,
        output_path=dest_output,
        bgm_path=None,  # BGM was already mixed into foley_mixed_audio
    )
    report_progress("rendering", 100)

    elapsed = time.time() - start_time
    file_size = final_video.stat().st_size

    print(f"\n=======================================================")
    print(f" ANIMATED STORY GENERATED! Runtime: {elapsed:.1f}s")
    print(f" File:     {final_video}")
    print(f" Size:     {file_size / (1024 * 1024):.2f} MB")
    print(f" Duration: {tts_result.total_duration:.2f}s")
    print(f" Title:    {story.title}")
    print(f" Style:    {style}")
    print(f" Cast:     {', '.join([c.name for c in story.characters])}")
    print(f"=======================================================\n")

    if cleanup_temp:
        cleanup_temp_dir()

    return StoryGenerationResult(
        video_path=final_video,
        script=story,
        tts_result=tts_result,
        duration_seconds=tts_result.total_duration,
        file_size_bytes=file_size,
        elapsed_time_seconds=elapsed,
    )

