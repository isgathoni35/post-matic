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


def select_best_video_file(video_files: List[dict]) -> Optional[dict]:
    """Select the best matching vertical/high-res MP4 video file from Pexels video_files list.

    Prefers 1080x1920 (Full HD Vertical), then other vertical HD resolutions,
    then highest quality MP4.
    """
    mp4_files = [f for f in video_files if f.get("file_type") == "video/mp4" and f.get("link")]
    if not mp4_files:
        return None

    # Priority 1: Exact 1080x1920 vertical MP4
    for f in mp4_files:
        if f.get("width") == 1080 and f.get("height") == 1920:
            return f

    # Priority 2: Any vertical MP4 (height > width) with height >= 720
    vertical_files = [f for f in mp4_files if (f.get("height") or 0) > (f.get("width") or 0)]
    if vertical_files:
        # Sort by resolution closest to 1080x1920
        vertical_files.sort(
            key=lambda x: abs((x.get("width") or 0) - 1080) + abs((x.get("height") or 0) - 1920)
        )
        return vertical_files[0]

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
) -> Optional[tuple[dict, dict, str]]:
    """Search Pexels API across a list of keyword queries.

    Returns (video_metadata, selected_video_file, keyword_used) or None if no video found.
    """
    headers = get_pexels_headers(api_key)
    used = used_ids or set()
    all_queries = expand_search_queries(keywords)

    # Primary pass: portrait vertical footage
    for query in all_queries:
        cleaned_query = query.strip()
        if not cleaned_query:
            continue

        try:
            logger.info("Searching Pexels for keyword (portrait): '%s'", cleaned_query)
            params = {
                "query": cleaned_query,
                "orientation": "portrait",
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

                best_file = select_best_video_file(video.get("video_files", []))
                if best_file:
                    return video, best_file, cleaned_query

        except Exception as e:
            logger.warning("Error querying Pexels for '%s': %s", cleaned_query, e)
            continue

    # Secondary pass: high-res landscape clips (FFmpeg center-crops into 9:16)
    for query in all_queries:
        cleaned_query = query.strip()
        try:
            logger.info("Searching Pexels for keyword (landscape fallback): '%s'", cleaned_query)
            params = {
                "query": cleaned_query,
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
                    best_file = select_best_video_file(video.get("video_files", []))
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
) -> DownloadedVideo:
    """Find, download, or generate background media for a single scene.

    Hierarchy:
    1. Stock Video Search via Pexels API (portrait + landscape center-crop).
    2. AI Visual Generation via Google Imagen 3 (Nano Banana) using existing Gemini API key.
    3. Topic-Anchored Stock Video Fallback (avoids generic random nature footage).
    """
    target_dir = output_dir or (TEMP_DIR / "media")
    used = used_ids if used_ids is not None else set()

    # Step 1: Search Pexels for stock video
    search_result = search_pexels_video(
        keywords=keywords,
        min_duration=min(3.0, target_duration),
        used_ids=used,
        api_key=api_key,
    )

    # Step 2: If stock video returned no match, try Google Imagen 3 AI visual generation
    use_ai = enable_ai_fallback if enable_ai_fallback is not None else ENABLE_AI_IMAGE_FALLBACK
    if not search_result and use_ai:
        prompt_desc = visual_description or (", ".join(keywords) if keywords else "cinematic visual")
        logger.info("Pexels returned 0 clips for Scene %d. Triggering Imagen 3 AI visual generation...", scene_id)
        print(f"      [AI Visual Fallback] Generating 9:16 custom visual with Imagen 3 for Scene {scene_id}...", flush=True)

        ai_image_path = generate_ai_scene_image(
            scene_id=scene_id,
            visual_description=prompt_desc,
            topic=topic,
            output_dir=target_dir,
            api_key=gemini_api_key,
        )

        if ai_image_path and ai_image_path.exists() and ai_image_path.stat().st_size > 0:
            return DownloadedVideo(
                scene_id=scene_id,
                video_id=900000 + scene_id,
                file_path=ai_image_path,
                duration=target_duration,
                width=1080,
                height=1920,
                download_url="ai://imagen-3",
                keyword_used=prompt_desc[:50],
                is_ai_generated=True,
                source="imagen",
            )
        logger.warning("AI image generation was unavailable for Scene %d. Proceeding to topic stock fallback.", scene_id)

    # Step 3: Topic-anchored stock fallback (replaces generic nature/stars)
    if not search_result:
        topic_fallbacks: List[str] = []
        if topic and topic.strip():
            clean_top = re.sub(r"[^\w\s]", "", topic).strip()
            words = clean_top.split()
            if len(words) <= 3:
                topic_fallbacks.append(clean_top)
            else:
                topic_fallbacks.append(" ".join(words[:2]))
                topic_fallbacks.append(" ".join(words[-2:]))
        topic_fallbacks.extend(["cinematic 4k vertical", "abstract dark background vertical"])

        fallback_result = search_pexels_video(
            keywords=topic_fallbacks,
            min_duration=2.0,
            used_ids=used,
            api_key=api_key,
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

    return DownloadedVideo(
        scene_id=scene_id,
        video_id=vid_id,
        file_path=file_path,
        duration=float(video_meta.get("duration", 0)),
        width=int(file_meta.get("width") or video_meta.get("width", 1080)),
        height=int(file_meta.get("height") or video_meta.get("height", 1920)),
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
            "Fetching media for Scene %d (keywords: %s, duration: %.1fs)...",
            scene.scene_id,
            scene.search_keywords,
            target_dur,
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
        )
        downloaded_videos.append(video)
        if video.is_ai_generated:
            print(f"      Scene {video.scene_id}: [AI Generated via Imagen 3] '{video.keyword_used}'", flush=True)
        else:
            print(f"      Scene {video.scene_id}: matched '{video.keyword_used}' (Pexels Video ID: {video.video_id})", flush=True)

    return downloaded_videos


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
