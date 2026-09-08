"""AI Visual Generation module using Google Imagen 3 (Nano Banana) via GenAI SDK."""
import logging
from pathlib import Path
import sys
from typing import Optional

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


def build_cinematic_prompt(visual_description: str, topic: Optional[str] = None) -> str:
    """Construct an enhanced, photorealistic 9:16 prompt for Imagen 3."""
    clean_desc = visual_description.strip()
    context_prefix = f"Topic context: {topic.strip()}. " if topic and topic.strip() else ""

    # Aesthetic quality modifiers specifically tuned for vertical mobile video
    enhancers = (
        "Cinematic vertical 9:16 composition, photorealistic, 8k resolution, "
        "hyperdetailed, volumetric cinematic lighting, dramatic atmosphere, "
        "sharp focus, professional cinematography, masterwork quality, "
        "no text, no watermark, no captions, no split screen, no borders"
    )

    return f"{context_prefix}{clean_desc}. {enhancers}"


def generate_ai_scene_image(
    scene_id: int,
    visual_description: str,
    topic: Optional[str] = None,
    output_dir: Optional[Path] = None,
    api_key: Optional[str] = None,
    preferred_model: Optional[str] = None,
) -> Optional[Path]:
    """Generate a custom 9:16 photorealistic image for a scene using Google Imagen 3.

    Args:
        scene_id: The scene index (e.g. 1, 2, 3).
        visual_description: Description of what should visually appear.
        topic: Overall video concept/topic for additional contextual grounding.
        output_dir: Target directory to save the generated image file.
        api_key: Optional override for Gemini API Key.
        preferred_model: Optional override for preferred Imagen model name.

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
    logger.info("Requesting Imagen 3 visual for Scene %d (prompt length: %d chars)...", scene_id, len(prompt))

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
                    aspect_ratio="9:16",
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
