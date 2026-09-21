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

import httpx
import random
import urllib.parse

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
        "no watermark, no subtitles, no text, no photorealism, non-photorealistic 2D drawing"
    ),
    "donghua": (
        "Chinese 3D cultivation donghua animation aesthetic, xianxia fantasy world, "
        "glossy 3D CGI volumetric rendering, ethereal glowing mythical auras, cinematic martial arts lighting, "
        "hyperdetailed textures, 9:16 vertical composition, no text, no watermark, stylized 3D CGI"
    ),
    "stickman": (
        "Epic 2D stick figure martial arts action battle, Alan Becker animator vs animation aesthetic, "
        "minimalist dark background, crisp glowing neon line art stick figures with solid circular blank heads, "
        "fluid acrobatic fighting choreography, glowing energy combat trails, speed lines, "
        "sharp focus, 9:16 vertical composition, no text, no watermark, no photorealism, no real humans"
    ),
    "3d_cartoon": (
        "DreamWorks and Pixar 3D feature animation style, rich subsurface scattering, "
        "whimsical expressive character design, cinematic studio lighting, vibrant storybook textures, "
        "masterwork 3D render, 9:16 vertical composition, no text, no watermark, stylized cartoon design"
    ),
    "realistic": (
        "Cinematic vertical 9:16 composition, photorealistic, 8k resolution, "
        "hyperdetailed, volumetric cinematic lighting, dramatic atmosphere, "
        "sharp focus, professional cinematography, masterwork quality, "
        "no text, no watermark, no captions, no split screen, no borders"
    ),
}

NEGATIVE_PROMPTS = {
    "stickman": (
        "photorealistic, real humans, realistic skin, human face, realistic anatomy, live action, "
        "photography, clothing, denim, hair, real life footage, blurry, low quality, watermark, text"
    ),
    "anime": (
        "photorealistic, real humans, live action, 3d render, photography, real life footage, "
        "real skin, realistic eyes, blurry, low quality, watermark, text"
    ),
    "donghua": (
        "photorealistic real humans, live action, 2D flat drawing, blurry, low quality, watermark, text"
    ),
    "3d_cartoon": (
        "photorealistic real humans, live action, photography, real life footage, blurry, low quality, watermark, text"
    ),
    "realistic": (
        "cartoon, 2d, drawing, anime, illustration, low resolution, blurry, watermark, text"
    ),
}


def generate_zero_opex_image(
    prompt: str,
    output_path: Path,
    aspect_ratio: str = "9:16",
    seed: Optional[int] = None,
) -> Optional[Path]:
    """Generate high-quality stylized visual keyframe via fast zero-cost AI model (Pollinations SDXL/Turbo).
    
    Zero-OpEx: Requires no API key, incurs zero cloud bill, and runs in ~2.5 to 5.0 seconds.
    """
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    if aspect_ratio == "16:9":
        w, h = 1280, 720
    else:
        w, h = 720, 1280

    chosen_seed = seed if seed is not None else random.randint(100000, 999999999)
    encoded_prompt = urllib.parse.quote(prompt.strip()[:1800])
    
    # Try models in order: turbo (ultra-fast 2.5s) -> flux (high fidelity)
    models_to_try = ["turbo", "flux"]
    
    for model_name in models_to_try:
        url = (
            f"https://image.pollinations.ai/prompt/{encoded_prompt}"
            f"?width={w}&height={h}&seed={chosen_seed}&nologo=true&model={model_name}"
        )
        try:
            logger.info("Requesting Zero-OpEx visual via Pollinations [%s] (aspect %s, seed %d)...", model_name, aspect_ratio, chosen_seed)
            headers = {"User-Agent": "PostMatic-ZeroOpEx-Engine/1.0"}
            
            with httpx.Client(timeout=25.0) as client:
                res = client.get(url, headers=headers)
                
            if res.status_code == 200 and len(res.content) > 3000:
                # Verify JPEG/PNG magic bytes
                if res.content.startswith(b"\xff\xd8") or res.content.startswith(b"\x89PNG"):
                    output_path.write_bytes(res.content)
                    logger.info(
                        "Successfully synthesized visual via Pollinations [%s] (%d KB): %s",
                        model_name,
                        len(res.content) // 1024,
                        output_path.name,
                    )
                    return output_path
                else:
                    logger.warning("Pollinations [%s] returned invalid non-image payload.", model_name)
            else:
                logger.warning("Pollinations [%s] failed with status %d (size: %d bytes).", model_name, res.status_code, len(res.content))
        except Exception as poll_err:
            logger.warning("Pollinations [%s] connection failed: %s", model_name, poll_err)
            continue

    return None


def build_cinematic_prompt(visual_description: str, topic: Optional[str] = None) -> str:
    """Construct an enhanced, photorealistic 9:16 prompt for Imagen 3."""
    clean_desc = visual_description.strip()
    context_prefix = f"Topic context: {topic.strip()}. " if topic and topic.strip() else ""

    enhancers = STYLE_MODIFIERS["realistic"]
    neg_clause = NEGATIVE_PROMPTS.get("realistic", "")
    neg_part = f" Avoid: {neg_clause}." if neg_clause else ""
    return f"{context_prefix}{clean_desc}. {enhancers}.{neg_part}"


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
    neg_clause = NEGATIVE_PROMPTS.get(style.lower(), "")
    neg_part = f" Avoid: {neg_clause}." if neg_clause else ""
    return f"{char_part}{env_part}{action_part}Style: {style_enhancer}.{neg_part}"



def generate_ai_scene_image(
    scene_id: int,
    visual_description: str,
    topic: Optional[str] = None,
    output_dir: Optional[Path] = None,
    api_key: Optional[str] = None,
    preferred_model: Optional[str] = None,
    aspect_ratio: str = "9:16",
) -> Optional[Path]:
    """Generate a custom photorealistic image for a scene using Zero-OpEx AI engine with Imagen fallback."""
    target_dir = output_dir or (TEMP_DIR / "media")
    target_dir.mkdir(parents=True, exist_ok=True)
    output_path = target_dir / f"scene_{scene_id}_ai_visual.jpg"

    # If cached valid image already exists, return immediately
    if output_path.exists() and output_path.stat().st_size > 5000:
        logger.info("Using cached AI visual for Scene %d: %s", scene_id, output_path)
        return output_path

    prompt = build_cinematic_prompt(visual_description, topic)

    # 1. Primary: Fast Zero-OpEx AI Image Generation (SDXL Turbo)
    zero_opex_img = generate_zero_opex_image(
        prompt=prompt,
        output_path=output_path,
        aspect_ratio=aspect_ratio,
        seed=1000 + scene_id,
    )
    if zero_opex_img and zero_opex_img.exists() and zero_opex_img.stat().st_size > 3000:
        return zero_opex_img

    # 2. Secondary: Google Imagen 3 fallback (if configured with active quota)
    try:
        client = get_gemini_client(api_key)
        models_to_try = [preferred_model] if preferred_model else []
        for m in IMAGEN_MODELS:
            if m not in models_to_try:
                models_to_try.append(m)

        for model_name in models_to_try:
            try:
                logger.info("Attempting Imagen generation with model: %s", model_name)
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
                        return output_path
            except Exception as e:
                logger.warning("Imagen model '%s' failed for Scene %d: %s", model_name, scene_id, e)
                continue
    except Exception as err:
        logger.warning("Imagen client fallback unavailable: %s", err)

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
    """Generate a style-consistent keyframe for an animated story scene.

    Prioritizes the Zero-OpEx fast generator for stickman/anime/donghua/3d_cartoon to guarantee
    non-photorealistic aesthetics with zero quota limits and zero API billing.
    """
    target_dir = output_dir or (TEMP_DIR / "media")
    target_dir.mkdir(parents=True, exist_ok=True)
    output_path = target_dir / f"story_scene_{scene_id}_{style}.jpg"

    if output_path.exists() and output_path.stat().st_size > 5000:
        logger.info("Using cached story visual for Scene %d (%s): %s", scene_id, style, output_path)
        return output_path

    prompt = build_story_scene_prompt(
        visual_description=visual_description,
        environment_anchor=environment_anchor,
        character_dna_list=character_dna_list,
        style=style,
    )
    logger.info("Requesting stylized visual for Story Scene %d [%s] (%s, prompt: %d chars)...", scene_id, style, aspect_ratio, len(prompt))

    # 1. Primary: Zero-OpEx Fast Stylized Generator (Pollinations Turbo/SDXL)
    # This guarantees stick figures and anime art are drawn natively without quota failures
    zero_opex_res = generate_zero_opex_image(
        prompt=prompt,
        output_path=output_path,
        aspect_ratio=aspect_ratio,
        seed=50000 + (scene_id * 137),
    )
    if zero_opex_res and zero_opex_res.exists() and zero_opex_res.stat().st_size > 3000:
        logger.info("Successfully generated Story visual for Scene %d [%s] via Zero-OpEx Engine (%d KB)", scene_id, style, output_path.stat().st_size // 1024)
        return zero_opex_res

    # 2. Secondary: Google Imagen fallback (if active account with quota exists)
    try:
        client = get_gemini_client(api_key)
        models_to_try = [preferred_model] if preferred_model else []
        for m in IMAGEN_MODELS:
            if m not in models_to_try:
                models_to_try.append(m)

        for model_name in models_to_try:
            try:
                logger.info("Attempting story image generation with Imagen model: %s", model_name)
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
                        logger.info("Generated Story visual for Scene %d via %s (%d KB)", scene_id, model_name, output_path.stat().st_size // 1024)
                        return output_path
            except Exception as e:
                logger.warning("Imagen generation with '%s' failed for story scene %d: %s", model_name, scene_id, e)
                continue
    except Exception as err:
        logger.warning("GenAI client unavailable for fallback: %s", err)

    logger.warning("All visual generators exhausted for Story Scene %d [%s].", scene_id, style)
    return None

