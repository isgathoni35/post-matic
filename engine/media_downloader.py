"""Media downloader module for Pexels Stock Video API."""
from dataclasses import dataclass
import logging
from pathlib import Path
import re
import sys
from typing import Dict, List, Optional, Set

# Ensure project root is on sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import requests
from engine.config import ENABLE_AI_IMAGE_FALLBACK, PEXELS_API_KEY, TEMP_DIR
from engine.image_generator import generate_ai_scene_image
from engine.schema import VideoScript

logger = logging.getLogger(__name__)

PEXELS_SEARCH_URL = "https://api.pexels.com/videos/search"
PEXELS_POPULAR_URL = "https://api.pexels.com/videos/popular"


@dataclass
class DownloadedVideo:
    """Metadata and local file path for a downloaded stock video or AI-generated asset."""
    scene_id: int
    video_id: int
    file_path: Path
    duration: float
    width: int
    height: int
    download_url: str
    keyword_used: str
    is_ai_generated: bool = False
    source: str = "pexels"


def get_pexels_headers(api_key: Optional[str] = None) -> Dict[str, str]:
    """Return authorization headers for Pexels API."""
    key = api_key or PEXELS_API_KEY
    if not key:
        raise ValueError("PEXELS_API_KEY is missing. Please set it in your .env file.")
    return {"Authorization": key}


def select_best_video_file(video_files: List[dict], video_format: str = "short") -> Optional[dict]:
    """Select the best matching MP4 video file from Pexels video_files list.

    For 'long' format (16:9), prefers 1920x1080 landscape footage.
    For 'short' format (9:16), prefers 1080x1920 vertical footage.
    """
    mp4_files = [f for f in video_files if f.get("file_type", "video/mp4") == "video/mp4" and f.get("link")]
    if not mp4_files:
        return None

    target_w, target_h = (1920, 1080) if video_format == "long" else (1080, 1920)

    # Priority 1: Exact target dimension MP4
    for f in mp4_files:
        if f.get("width") == target_w and f.get("height") == target_h:
            return f

    # Priority 2: Matching orientation (width > height for long, height > width for short)
    if video_format == "long":
        oriented_files = [f for f in mp4_files if (f.get("width") or 0) > (f.get("height") or 0)]
    else:
        oriented_files = [f for f in mp4_files if (f.get("height") or 0) > (f.get("width") or 0)]

    if oriented_files:
        oriented_files.sort(
            key=lambda x: abs((x.get("width") or 0) - target_w) + abs((x.get("height") or 0) - target_h)
        )
        return oriented_files[0]

    # Priority 3: Highest resolution available
    mp4_files.sort(key=lambda x: (x.get("width") or 0) * (x.get("height") or 0), reverse=True)
    return mp4_files[0]


def expand_search_queries(keywords: List[str]) -> List[str]:
    """Expands list of keyword queries with simplified 1-3 word noun phrases."""
    expanded: List[str] = []
    for kw in keywords:
        cleaned = kw.strip()
        if not cleaned or cleaned in expanded:
            continue
        expanded.append(cleaned)
        words = cleaned.split()
        if len(words) > 3:
            sub1 = " ".join(words[:2])
            sub2 = " ".join(words[-2:])
            if sub1 not in expanded:
                expanded.append(sub1)
            if sub2 not in expanded:
                expanded.append(sub2)
    return expanded


def search_pexels_video(
    keywords: List[str],
    min_duration: float = 3.0,
    used_ids: Optional[Set[int]] = None,
    api_key: Optional[str] = None,
    video_format: str = "short",
) -> Optional[tuple[dict, dict, str]]:
    """Search Pexels API across a list of keyword queries.

    Returns (video_metadata, selected_video_file, keyword_used) or None if no video found.
    """
    headers = get_pexels_headers(api_key)
    used = used_ids or set()
    all_queries = expand_search_queries(keywords)

    primary_orientation = "landscape" if video_format == "long" else "portrait"
    secondary_orientation = "portrait" if video_format == "long" else "landscape"

    # Primary pass: footage matching the preferred orientation
    for query in all_queries:
        cleaned_query = query.strip()
        if not cleaned_query:
            continue

        try:
            logger.info("Searching Pexels for keyword (%s): '%s'", primary_orientation, cleaned_query)
            params = {
                "query": cleaned_query,
                "orientation": primary_orientation,
                "per_page": 12,
            }
            response = requests.get(PEXELS_SEARCH_URL, headers=headers, params=params, timeout=15)
            if response.status_code != 200:
                logger.warning("Pexels query '%s' returned status %d: %s", cleaned_query, response.status_code, response.text)
                continue

            data = response.json()
            videos = data.get("videos", [])

            for video in videos:
                vid_id = video.get("id")
                if vid_id in used:
                    continue

                duration = video.get("duration", 0)
                if duration < min_duration:
                    continue

                best_file = select_best_video_file(video.get("video_files", []), video_format=video_format)
                if best_file:
                    return video, best_file, cleaned_query

        except Exception as e:
            logger.warning("Error querying Pexels for '%s': %s", cleaned_query, e)
            continue

    # Secondary pass: opposite orientation clips (FFmpeg center-crops / scales to canvas)
    for query in all_queries:
        cleaned_query = query.strip()
        try:
            logger.info("Searching Pexels for keyword (%s fallback): '%s'", secondary_orientation, cleaned_query)
            params = {
                "query": cleaned_query,
                "orientation": secondary_orientation,
                "per_page": 10,
            }
            response = requests.get(PEXELS_SEARCH_URL, headers=headers, params=params, timeout=15)
            if response.status_code == 200:
                data = response.json()
                for video in data.get("videos", []):
                    vid_id = video.get("id")
                    if vid_id in used:
                        continue
                    if video.get("duration", 0) < min_duration:
                        continue
                    best_file = select_best_video_file(video.get("video_files", []), video_format=video_format)
                    if best_file:
                        return video, best_file, cleaned_query
        except Exception:
            continue

    return None


def download_file(url: str, destination: Path, timeout: int = 60) -> Path:
    """Download a file with streaming chunks and verify file integrity."""
    destination.parent.mkdir(parents=True, exist_ok=True)
    logger.info("Downloading file from: %s -> %s", url, destination)

    response = requests.get(url, stream=True, timeout=timeout)
    response.raise_for_status()

    with open(destination, "wb") as f:
        for chunk in response.iter_content(chunk_size=1024 * 64):
            if chunk:
                f.write(chunk)

    if not destination.exists() or destination.stat().st_size == 0:
        raise IOError(f"Downloaded file is empty or missing: {destination}")

    return destination


def fetch_scene_media(
    scene_id: int,
    keywords: List[str],
    visual_description: Optional[str] = None,
    topic: Optional[str] = None,
    target_duration: float = 5.0,
    used_ids: Optional[Set[int]] = None,
    output_dir: Optional[Path] = None,
    api_key: Optional[str] = None,
    gemini_api_key: Optional[str] = None,
    enable_ai_fallback: Optional[bool] = None,
    video_format: str = "short",
) -> DownloadedVideo:
    """Find, download, or generate background media for a single scene.

    Hierarchy:
    1. Stock Video Search via Pexels API (portrait or landscape based on video_format).
    2. AI Visual Generation via Google Imagen 3 (Nano Banana) using existing Gemini API key.
    3. Topic-Anchored Stock Video Fallback (avoids generic random nature footage).
    """
    target_dir = output_dir or (TEMP_DIR / "media")
    used = used_ids if used_ids is not None else set()

    # Quarantine Pexels if the topic/scene requests stylized animation (stickman, anime, etc.)
    # Pexels exclusively contains live-action humans and will ruin stylized video genres.
    stylized_terms = {"stickman", "stick figure", "anime", "manga", "donghua", "3d_cartoon", "animation", "cel shaded"}
    combined_desc = f"{topic or ''} {' '.join(keywords)} {visual_description or ''}".lower()
    is_stylized = any(term in combined_desc for term in stylized_terms)

    search_result = None

    # Step 1: Search Pexels for stock video (ONLY for realistic/live-action content)
    if not is_stylized:
        search_result = search_pexels_video(
            keywords=keywords,
            min_duration=min(3.0, target_duration),
            used_ids=used,
            api_key=api_key,
            video_format=video_format,
        )
    else:
        logger.info("Scene %d is stylized animation (%s). Quarantining Pexels stock video to prevent real-human footage.", scene_id, topic)

    # Step 2: AI Visual Generation via Zero-OpEx Engine / Imagen 3
    use_ai = enable_ai_fallback if enable_ai_fallback is not None else ENABLE_AI_IMAGE_FALLBACK
    if (not search_result and use_ai) or is_stylized:
        prompt_desc = visual_description or (", ".join(keywords) if keywords else "cinematic visual")
        aspect_ratio = "16:9" if video_format == "long" else "9:16"
        logger.info("Generating AI visual keyframe for Scene %d (%s, stylized=%s)...", scene_id, aspect_ratio, is_stylized)

        ai_image_path = generate_ai_scene_image(
            scene_id=scene_id,
            visual_description=prompt_desc,
            topic=topic,
            output_dir=target_dir,
            api_key=gemini_api_key,
            aspect_ratio=aspect_ratio,
        )

        if ai_image_path and ai_image_path.exists() and ai_image_path.stat().st_size > 0:
            target_w, target_h = (1920, 1080) if video_format == "long" else (1080, 1920)
            return DownloadedVideo(
                scene_id=scene_id,
                video_id=900000 + scene_id,
                file_path=ai_image_path,
                duration=target_duration,
                width=target_w,
                height=target_h,
                download_url="ai://zero-opex",
                keyword_used=prompt_desc[:50],
                is_ai_generated=True,
                source="imagen",
            )
        logger.warning("AI image generation was unavailable for Scene %d. Proceeding to fallback.", scene_id)

    # Step 3: Fallback media resolution
    if not search_result:
        if is_stylized:
            from engine.pipeline import create_fallback_story_frame
            fallback_img_path = target_dir / f"scene_{scene_id}_stylized_fallback.jpg"
            detected_style = "stickman" if "stick" in combined_desc else ("anime" if "anime" in combined_desc else "donghua")
            create_fallback_story_frame(scene_id, detected_style, fallback_img_path)
            target_w, target_h = (1920, 1080) if video_format == "long" else (1080, 1920)
            return DownloadedVideo(
                scene_id=scene_id,
                video_id=900000 + scene_id,
                file_path=fallback_img_path,
                duration=target_duration,
                width=target_w,
                height=target_h,
                download_url="ai://procedural-stylized",
                keyword_used=topic[:50] if topic else "stylized",
                is_ai_generated=True,
                source="imagen",
            )

        topic_fallbacks: List[str] = []
        if topic and topic.strip():
            clean_top = re.sub(r"[^\w\s]", "", topic).strip()
            words = clean_top.split()
            if len(words) <= 3:
                topic_fallbacks.append(clean_top)
            else:
                topic_fallbacks.append(" ".join(words[:2]))
                topic_fallbacks.append(" ".join(words[-2:]))
        
        fallback_style = "landscape" if video_format == "long" else "vertical"
        topic_fallbacks.extend([f"cinematic 4k {fallback_style}", f"abstract dark background {fallback_style}"])

        fallback_result = search_pexels_video(
            keywords=topic_fallbacks,
            min_duration=2.0,
            used_ids=used,
            api_key=api_key,
            video_format=video_format,
        )
        if not fallback_result:
            raise RuntimeError(f"Could not find or generate any suitable media asset for Scene {scene_id}.")
        search_result = fallback_result

    video_meta, file_meta, matched_keyword = search_result
    vid_id = video_meta["id"]
    used.add(vid_id)

    download_url = file_meta["link"]
    file_path = target_dir / f"scene_{scene_id}_{vid_id}.mp4"

    # Download file if not already cached
    if not file_path.exists() or file_path.stat().st_size == 0:
        download_file(download_url, file_path)

    default_w, default_h = (1920, 1080) if video_format == "long" else (1080, 1920)
    return DownloadedVideo(
        scene_id=scene_id,
        video_id=vid_id,
        file_path=file_path,
        duration=float(video_meta.get("duration", 0)),
        width=int(file_meta.get("width") or video_meta.get("width", default_w)),
        height=int(file_meta.get("height") or video_meta.get("height", default_h)),
        download_url=download_url,
        keyword_used=matched_keyword,
        is_ai_generated=False,
        source="pexels",
    )


def fetch_script_media(
    script: VideoScript,
    scene_durations: Optional[Dict[int, float]] = None,
    output_dir: Optional[Path] = None,
    api_key: Optional[str] = None,
    gemini_api_key: Optional[str] = None,
    enable_ai_fallback: Optional[bool] = None,
    video_format: str = "short",
) -> List[DownloadedVideo]:
    """Download background video assets or generate AI visuals for all scenes in a VideoScript."""
    target_dir = output_dir or (TEMP_DIR / "media")
    target_dir.mkdir(parents=True, exist_ok=True)

    durations = scene_durations or {}
    used_ids: Set[int] = set()
    downloaded_videos: List[DownloadedVideo] = []

    for scene in script.scenes:
        target_dur = durations.get(scene.scene_id, 5.0)
        print(f"      Fetching media for Scene {scene.scene_id} (keywords: {scene.search_keywords})...", flush=True)
        logger.info(
            "Fetching media for Scene %d (keywords: %s, duration: %.1fs, format: %s)...",
            scene.scene_id,
            scene.search_keywords,
            target_dur,
            video_format,
        )

        video = fetch_scene_media(
            scene_id=scene.scene_id,
            keywords=scene.search_keywords,
            visual_description=scene.visual_description,
            topic=script.title or script.description,
            target_duration=target_dur,
            used_ids=used_ids,
            output_dir=target_dir,
            api_key=api_key,
            gemini_api_key=gemini_api_key,
            enable_ai_fallback=enable_ai_fallback,
            video_format=video_format,
        )
        downloaded_videos.append(video)
        if video.is_ai_generated:
            print(f"      Scene {video.scene_id}: [AI Generated via Imagen 3] '{video.keyword_used}'", flush=True)
        else:
            print(f"      Scene {video.scene_id}: matched '{video.keyword_used}' (Pexels Video ID: {video.video_id})", flush=True)

    return downloaded_videos


def download_background_music(
    source: Optional[str],
    output_dir: Optional[Path] = None,
    ffmpeg_bin: Optional[str] = None,
) -> Optional[Path]:
    """Resolve, download, or extract background music from a URL, preset name, or local path.

    Supports:
    - Direct TikTok sound/video URLs (e.g., https://www.tiktok.com/@... or https://vm.tiktok.com/...)
    - YouTube / YouTube Shorts / Audio links (e.g., https://www.youtube.com/...)
    - Direct audio URLs (.mp3, .wav, .m4a, .aac, .ogg)
    - Local preset names ('cinematic_ambient', 'lofi_chill', etc.)
    - Existing local file paths
    """
    if not source or not str(source).strip():
        return None

    clean_source = str(source).strip()

    # Case 1: Direct local file path
    local_path = Path(clean_source)
    if local_path.exists() and local_path.is_file():
        logger.info("Found local background music file: %s", local_path)
        return local_path

    # Case 2: Preset name in assets/audio/
    preset_candidate = PROJECT_ROOT / "assets" / "audio" / f"{clean_source}.mp3"
    if preset_candidate.exists():
        logger.info("Matched BGM preset in assets/audio: %s", preset_candidate)
        return preset_candidate
    preset_candidate_direct = PROJECT_ROOT / "assets" / "audio" / clean_source
    if preset_candidate_direct.exists() and preset_candidate_direct.is_file():
        logger.info("Matched BGM direct file in assets/audio: %s", preset_candidate_direct)
        return preset_candidate_direct

    # Case 3: URL (TikTok, YouTube, Direct Audio Link)
    if clean_source.startswith(("http://", "https://")):
        import hashlib
        import yt_dlp
        from engine.video_renderer import get_ffmpeg_binary

        target_dir = output_dir or (TEMP_DIR / "audio" / "bgm")
        target_dir.mkdir(parents=True, exist_ok=True)

        url_hash = hashlib.md5(clean_source.encode("utf-8")).hexdigest()[:12]
        cached_file = target_dir / f"bgm_{url_hash}.mp3"
        if cached_file.exists() and cached_file.stat().st_size > 1000:
            logger.info("Using cached background music for '%s': %s", clean_source, cached_file)
            return cached_file

        ffmpeg_path = ffmpeg_bin or get_ffmpeg_binary()
        output_template = str(target_dir / f"bgm_{url_hash}.%(ext)s")

        ydl_opts = {
            "format": "bestaudio/best",
            "outtmpl": output_template,
            "postprocessors": [{
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "192",
            }],
            "ffmpeg_location": ffmpeg_path,
            "quiet": True,
            "no_warnings": True,
            "noplaylist": True,
            "socket_timeout": 30,
        }

        try:
            logger.info("Downloading background music via yt-dlp from: %s", clean_source)
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([clean_source])

            if cached_file.exists() and cached_file.stat().st_size > 0:
                logger.info("Successfully extracted BGM to %s (%d bytes)", cached_file, cached_file.stat().st_size)
                return cached_file

            # Look for any file with this prefix in case yt-dlp saved it under another extension
            candidates = list(target_dir.glob(f"bgm_{url_hash}.*"))
            if candidates and candidates[0].stat().st_size > 0:
                logger.info("Found extracted BGM file: %s", candidates[0])
                return candidates[0]

        except Exception as yt_err:
            logger.warning("yt-dlp extraction failed for '%s': %s. Trying direct download...", clean_source, yt_err)
            try:
                download_file(clean_source, cached_file)
                if cached_file.exists() and cached_file.stat().st_size > 0:
                    logger.info("Successfully downloaded audio directly: %s", cached_file)
                    return cached_file
            except Exception as dl_err:
                logger.error("Direct download fallback failed: %s", dl_err)

    # Fallback: Default ambient BGM if available
    default_bgm = PROJECT_ROOT / "assets" / "audio" / "cinematic_ambient.mp3"
    if default_bgm.exists():
        logger.info("Falling back to default background music: %s", default_bgm)
        return default_bgm

    return None


if __name__ == "__main__":
    from engine.schema import Scene
    print("Testing Pexels Stock Video Downloader...")
    test_script = VideoScript(
        title="Ocean Wonders",
        description="Test script",
        tags=["ocean"],
        scenes=[
            Scene(
                scene_id=1,
                narration="The ocean covers more than seventy percent of our planet.",
                visual_description="Aerial drone shot of ocean waves",
                search_keywords=["ocean waves aerial vertical", "sea blue water vertical"],
            ),
            Scene(
                scene_id=2,
                narration="Yet more than eighty percent remains completely unmapped.",
                visual_description="Deep underwater sea life",
                search_keywords=["underwater deep sea vertical", "coral reef fish vertical"],
            ),
        ],
    )

    results = fetch_script_media(test_script)
    print("\n=== DOWNLOADED MEDIA ===")
    for v in results:
        print(f"Scene {v.scene_id} (Video ID: {v.video_id}):")
        print(f"  File:       {v.file_path} ({v.file_path.stat().st_size / (1024*1024):.2f} MB)")
        print(f"  Resolution: {v.width}x{v.height}")
        print(f"  Duration:   {v.duration}s")
        print(f"  Keyword:    '{v.keyword_used}'")
