"""Faceless Video Generation Engine package."""
from engine.schema import Scene, VideoScript
from engine.script_generator import generate_script
from engine.tts_engine import (
    WordTiming,
    SceneAudioResult,
    TTSResult,
    synthesize_scene,
    synthesize_script,
    apply_studio_mastering,
    generate_ass_subtitles,
    AVAILABLE_VOICES,
    DEFAULT_VOICE,
    SUBTITLE_STYLE_CONFIGS,
)
from engine.media_downloader import (
    DownloadedVideo,
    fetch_scene_media,
    fetch_script_media,
    search_pexels_video,
    download_background_music,
)
from engine.video_renderer import (
    burn_audio_and_subtitles,
    concatenate_clips,
    get_ffmpeg_binary,
    process_scene_clip,
    render_video,
)
from engine.pipeline import (
    VideoGenerationResult,
    generate_faceless_video,
)

__all__ = [
    "Scene",
    "VideoScript",
    "generate_script",
    "WordTiming",
    "SceneAudioResult",
    "TTSResult",
    "synthesize_scene",
    "synthesize_script",
    "apply_studio_mastering",
    "generate_ass_subtitles",
    "AVAILABLE_VOICES",
    "DEFAULT_VOICE",
    "SUBTITLE_STYLE_CONFIGS",
    "DownloadedVideo",
    "fetch_scene_media",
    "fetch_script_media",
    "search_pexels_video",
    "download_background_music",
    "burn_audio_and_subtitles",
    "concatenate_clips",
    "get_ffmpeg_binary",
    "process_scene_clip",
    "render_video",
    "VideoGenerationResult",
    "generate_faceless_video",
]



