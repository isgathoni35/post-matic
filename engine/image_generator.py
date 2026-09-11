"""AI Visual Generation module using Google Imagen 3 (Nano Banana) via GenAI SDK."""
import logging
from pathlib import Path
import sys
from typing import List, Optional

# Ensure project root is on sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from google import genai
from google.genai import types

from engine.config import GEMINI_API_KEY, IMAGEN_MODELS, TEMP_DIR

logger = logging.getLogger(__name__)


def get_gemini_client(api_key: Optional[str] = None) -> genai.Client:
    """Initialize and return a Google GenAI client."""
    key = api_key or GEMINI_API_KEY
    if not key:
        raise ValueError(
            "Gemini API Key is missing. Please set GEMINI_API_KEY in your .env file."
        )
    return genai.Client(api_key=key)


STYLE_MODIFIERS = {
    "anime": (
        "Japanese 2D anime masterwork keyframe, Studio Mappa and Ufotable aesthetic, "
        "crisp cel-shaded lines, vibrant anime color palette, expressive features, "
        "dynamic anime lighting, dramatic action lines, high resolution, 9:16 vertical composition, "
        "no watermark, no subtitles, no text, no split-screen"
    ),
    "donghua": (
        "Chinese 3D cultivation donghua animation aesthetic, xianxia fantasy world, "
        "glossy 3D CGI volumetric rendering, ethereal glowing mythical auras, cinematic martial arts lighting, "
        "hyperdetailed textures, 9:16 vertical composition, no text, no watermark"
    ),
    "stickman": (
        "Epic stick figure martial arts action battle, Alan Becker animator vs animation aesthetic, "
        "fluid fight choreography, high contrast vivid neon combat energy trails, speed lines, "
        "minimalist cinematic background, sharp focus, 9:16 vertical composition, no text"
    ),
    "3d_cartoon": (
        "DreamWorks and Pixar 3D feature animation style, rich subsurface scattering, "
        "whimsical expressive character design, cinematic studio lighting, vibrant storybook textures, "
        "masterwork 3D render, 9:16 vertical composition, no text, no watermark"
    ),
    "realistic": (
        "Cinematic vertical 9:16 composition, photorealistic, 8k resolution, "
        "hyperdetailed, volumetric cinematic lighting, dramatic atmosphere, "
        "sharp focus, professional cinematography, masterwork quality, "
        "no text, no watermark, no captions, no split screen, no borders"
    ),
}


def build_cinematic_prompt(visual_description: str, topic: Optional[str] = None) -> str:
    """Construct an enhanced, photorealistic 9:16 prompt for Imagen 3."""
    clean_desc = visual_description.strip()
    context_prefix = f"Topic context: {topic.strip()}. " if topic and topic.strip() else ""

    enhancers = STYLE_MODIFIERS["realistic"]
    return f"{context_prefix}{clean_desc}. {enhancers}"


def build_story_scene_prompt(
    visual_description: str,
    environment_anchor: str,
    character_dna_list: Optional[List[str]] = None,
    style: str = "anime",
) -> str:
    """Construct an anchored, style-specific 9:16 prompt for animated story scenes."""
    clean_desc = visual_description.strip()
    env = environment_anchor.strip()
    chars = " | ".join([c.strip() for c in character_dna_list]) if character_dna_list else ""

    char_part = f"Characters Present: {chars}. " if chars else ""
    env_part = f"Setting/Environment: {env}. " if env else ""
    action_part = f"Action: {clean_desc}. "

    style_enhancer = STYLE_MODIFIERS.get(style.lower(), STYLE_MODIFIERS["anime"])
    return f"{char_part}{env_part}{action_part}Style: {style_enhancer}"



def generate_ai_scene_image(
    scene_id: int,
    visual_description: str,
    topic: Optional[str] = None,
    output_dir: Optional[Path] = None,
    api_key: Optional[str] = None,
    preferred_model: Optional[str] = None,
    aspect_ratio: str = "9:16",
) -> Optional[Path]:
    """Generate a custom photorealistic image for a scene using Google Imagen 3.

    Args:
        scene_id: The scene index (e.g. 1, 2, 3).
        visual_description: Description of what should visually appear.
        topic: Overall video concept/topic for additional contextual grounding.
        output_dir: Target directory to save the generated image file.
        api_key: Optional override for Gemini API Key.
        preferred_model: Optional override for preferred Imagen model name.
        aspect_ratio: Aspect ratio string (e.g. "9:16" for shorts, "16:9" for horizontal).

    Returns:
        Path to the saved image file on success, or None on failure/quota limit.
    """
    target_dir = output_dir or (TEMP_DIR / "media")
    target_dir.mkdir(parents=True, exist_ok=True)
    output_path = target_dir / f"scene_{scene_id}_ai_visual.jpg"

    # If cached valid image already exists, return immediately
    if output_path.exists() and output_path.stat().st_size > 5000:
        logger.info("Using cached AI visual for Scene %d: %s", scene_id, output_path)
        return output_path

    try:
        client = get_gemini_client(api_key)
    except Exception as err:
        logger.warning("Could not initialize GenAI client for image generation: %s", err)
        return None

    prompt = build_cinematic_prompt(visual_description, topic)
    logger.info("Requesting Imagen 3 visual for Scene %d (%s, prompt length: %d chars)...", scene_id, aspect_ratio, len(prompt))

    models_to_try = [preferred_model] if preferred_model else []
    for m in IMAGEN_MODELS:
        if m not in models_to_try:
            models_to_try.append(m)

    for model_name in models_to_try:
        try:
            logger.info("Attempting image generation with model: %s", model_name)
            response = client.models.generate_images(
                model=model_name,
                prompt=prompt,
                config=types.GenerateImagesConfig(
                    number_of_images=1,
                    aspect_ratio=aspect_ratio,
                    person_generation="ALLOW_ADULT",
                    output_mime_type="image/jpeg",
                    output_compression_quality=92,
                ),
            )

            if response and response.generated_images:
                gen_img = response.generated_images[0]
                img_obj = gen_img.image
                if img_obj and img_obj.image_bytes:
                    output_path.write_bytes(img_obj.image_bytes)
                    logger.info(
                        "Successfully generated AI visual for Scene %d via %s (%d KB): %s",
                        scene_id,
                        model_name,
                        output_path.stat().st_size // 1024,
                        output_path.name,
                    )
                    return output_path

            logger.warning("Model '%s' returned empty generated_images.", model_name)
        except Exception as e:
            logger.warning("Imagen generation with '%s' failed for Scene %d: %s", model_name, scene_id, e)
            continue

    logger.warning("All Imagen models exhausted for Scene %d. Falling back to stock media.", scene_id)
    return None


def generate_story_scene_image(
    scene_id: int,
    visual_description: str,
    environment_anchor: str,
    character_dna_list: Optional[List[str]] = None,
    style: str = "anime",
    output_dir: Optional[Path] = None,
    api_key: Optional[str] = None,
    preferred_model: Optional[str] = None,
    aspect_ratio: str = "9:16",
) -> Optional[Path]:
    """Generate a style-consistent keyframe for an animated story scene using Google Imagen 3.

    Injects consistent character DNA and environment settings to prevent visual drifting.
    """
    target_dir = output_dir or (TEMP_DIR / "media")
    target_dir.mkdir(parents=True, exist_ok=True)
    output_path = target_dir / f"story_scene_{scene_id}_{style}.jpg"

    if output_path.exists() and output_path.stat().st_size > 5000:
        logger.info("Using cached story visual for Scene %d (%s): %s", scene_id, style, output_path)
        return output_path

    try:
        client = get_gemini_client(api_key)
    except Exception as err:
        logger.warning("Could not initialize GenAI client for story image generation: %s", err)
        return None

    prompt = build_story_scene_prompt(
        visual_description=visual_description,
        environment_anchor=environment_anchor,
        character_dna_list=character_dna_list,
        style=style,
    )
    logger.info("Requesting Imagen 3 visual for Story Scene %d [%s] (%s, prompt: %d chars)...", scene_id, style, aspect_ratio, len(prompt))

    models_to_try = [preferred_model] if preferred_model else []
    for m in IMAGEN_MODELS:
        if m not in models_to_try:
            models_to_try.append(m)

    for model_name in models_to_try:
        try:
            logger.info("Attempting story image generation with model: %s", model_name)
            response = client.models.generate_images(
                model=model_name,
                prompt=prompt,
                config=types.GenerateImagesConfig(
                    number_of_images=1,
                    aspect_ratio=aspect_ratio,
                    person_generation="ALLOW_ADULT",
                    output_mime_type="image/jpeg",
                    output_compression_quality=92,
                ),
            )

            if response and response.generated_images:
                gen_img = response.generated_images[0]
                img_obj = gen_img.image
                if img_obj and img_obj.image_bytes:
                    output_path.write_bytes(img_obj.image_bytes)
                    logger.info(
                        "Successfully generated Story visual for Scene %d via %s (%d KB): %s",
                        scene_id,
                        model_name,
                        output_path.stat().st_size // 1024,
                        output_path.name,
                    )
                    return output_path

            logger.warning("Model '%s' returned empty generated_images for story scene.", model_name)
        except Exception as e:
            logger.warning("Imagen generation with '%s' failed for story scene %d: %s", model_name, scene_id, e)
            continue

    logger.warning("All Imagen models exhausted for Story Scene %d.", scene_id)
    return None

