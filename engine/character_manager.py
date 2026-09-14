"""Character management and Visual DNA extraction module for animated stories."""
import base64
import logging
from pathlib import Path
import re
import sys
from typing import Any, Dict, List, Optional, Union
import uuid

# Ensure project root is on sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from google import genai
from google.genai import types

from engine.config import GEMINI_API_KEY, GEMINI_MODELS, TEMP_DIR
from engine.schema import Character, CustomCharacterInput

logger = logging.getLogger(__name__)

CHARACTERS_DIR = TEMP_DIR / "characters"
CHARACTERS_DIR.mkdir(parents=True, exist_ok=True)

DEFAULT_VOICE_ROTATION = [
    "en-US-BrianMultilingualNeural",
    "en-US-AvaMultilingualNeural",
    "en-US-AndrewMultilingualNeural",
    "en-US-EmmaMultilingualNeural",
    "en-GB-SoniaNeural",
]

DEFAULT_COLOR_ROTATION = [
    "#38BDF8",  # Cyber Cyan
    "#F59E0B",  # Amber Gold
    "#22C55E",  # Emerald Green
    "#EC4899",  # Vivid Pink
    "#A855F7",  # Purple
]


def get_gemini_client(api_key: Optional[str] = None) -> genai.Client:
    """Initialize and return a Google GenAI client."""
    key = api_key or GEMINI_API_KEY
    if not key:
        raise ValueError("Gemini API Key is missing. Please set GEMINI_API_KEY in your .env file.")
    return genai.Client(api_key=key)


def save_character_image(image_data: str, character_id: str) -> Optional[Path]:
    """Save a base64 encoded image or copy a local image to the character cache.

    Args:
        image_data: Base64 data URI (e.g. 'data:image/png;base64,...'), raw base64, or file path.
        character_id: Unique slug for the character.

    Returns:
        Path to the saved image file, or None if invalid.
    """
    if not image_data or not image_data.strip():
        return None

    clean_data = image_data.strip()

    # Check if it's already an existing local file
    existing_file = Path(clean_data)
    if existing_file.is_file() and existing_file.exists():
        return existing_file

    # Check for base64 data URI
    mime_match = re.match(r"^data:(image/[a-zA-Z0-9.+_-]+);base64,(.+)$", clean_data)
    if mime_match:
        mime_type = mime_match.group(1)
        raw_b64 = mime_match.group(2)
        ext = ".png" if "png" in mime_type else ".jpg" if "jpeg" in mime_type or "jpg" in mime_type else ".webp"
    else:
        raw_b64 = clean_data
        ext = ".jpg"

    try:
        image_bytes = base64.b64decode(raw_b64)
        if len(image_bytes) < 10:
            return None
        dest_path = CHARACTERS_DIR / f"{character_id}_{uuid.uuid4().hex[:8]}{ext}"
        dest_path.write_bytes(image_bytes)
        logger.info("Saved reference image for character '%s' (%d bytes) to %s", character_id, len(image_bytes), dest_path)
        return dest_path
    except Exception as err:
        logger.warning("Failed to decode base64 character image for '%s': %s", character_id, err)
        return None


def extract_visual_dna_from_image(
    image_path: Path,
    character_name: str,
    visual_notes: Optional[str] = None,
    api_key: Optional[str] = None,
    preferred_model: Optional[str] = None,
) -> str:
    """Analyze a character reference image with Gemini Vision to extract consistent Visual DNA.

    Args:
        image_path: Path to the character reference image.
        character_name: The display name of the character.
        visual_notes: Optional supplemental notes provided by the user.
        api_key: Optional Gemini API key override.
        preferred_model: Optional preferred Gemini model.

    Returns:
        A concise visual DNA string suitable for prompt anchoring in Imagen 3.
    """
    if not image_path.exists() or image_path.stat().st_size == 0:
        if visual_notes:
            return f"{character_name}: {visual_notes}"
        return f"{character_name}: Distinctive features, signature attire, expressive look."

    try:
        client = get_gemini_client(api_key)
    except Exception as err:
        logger.warning("Could not initialize Gemini client for visual DNA extraction: %s", err)
        if visual_notes:
            return f"{character_name}: {visual_notes}"
        return f"{character_name}: Expressive anime character with distinctive appearance."

    mime_type = "image/jpeg"
    suffix = image_path.suffix.lower()
    if suffix == ".png":
        mime_type = "image/png"
    elif suffix == ".webp":
        mime_type = "image/webp"

    image_bytes = image_path.read_bytes()

    notes_clause = f"User supplemental notes: {visual_notes}. " if visual_notes else ""
    prompt = f"""You are an animation character visual supervisor.
Analyze this character reference image.
Character Name: {character_name}.
{notes_clause}
Extract a precise, consistent visual DNA description for this character so an AI image generator (Google Imagen 3) can reproduce their exact appearance across multiple action scenes.

Requirements:
1. Specify physical features and build (approximate age, facial structure, skin tone, eye color/shape).
2. Specify exact hair style, length, texture, and color.
3. Specify signature clothing, outfit silhouette, fabrics, color scheme, and distinct accessories/markings.
4. Keep the entire description to 30-55 words in a single dense sentence or concise paragraph.
5. Do NOT include greetings, markdown headings, or conversational fluff."""

    models_to_try = [preferred_model] if preferred_model else []
    for m in GEMINI_MODELS:
        if m not in models_to_try:
            models_to_try.append(m)

    for model_name in models_to_try:
        try:
            logger.info("Extracting Visual DNA for '%s' using %s...", character_name, model_name)
            response = client.models.generate_content(
                model=model_name,
                contents=[
                    types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                    prompt,
                ],
            )
            if response and response.text and response.text.strip():
                dna = response.text.strip()
                # Clean any accidental quotes
                dna = dna.strip('"').strip("'").strip()
                logger.info("Extracted Visual DNA for '%s': %s", character_name, dna)
                return f"{character_name}: {dna}"
        except Exception as err:
            logger.warning("Gemini Vision DNA extraction with '%s' failed: %s", model_name, err)
            continue

    # Fallback if Gemini Vision models fail
    if visual_notes:
        return f"{character_name}: {visual_notes}"
    return f"{character_name}: Expressive face, signature outfit, distinct silhouette."


def prepare_characters(
    custom_inputs: Optional[List[Union[CustomCharacterInput, Dict[str, Any]]]] = None,
    api_key: Optional[str] = None,
) -> List[Character]:
    """Convert user custom character inputs into fully-resolved Character models.

    Extracts Visual DNA from uploaded photos, assigns distinct voices and subtitle colors.

    Args:
        custom_inputs: List of CustomCharacterInput instances or dict representations.
        api_key: Optional Gemini API key override.

    Returns:
        List of Character model instances ready for screenplay & image pipelines.
    """
    if not custom_inputs:
        return []

    characters: List[Character] = []

    for idx, item in enumerate(custom_inputs):
        if isinstance(item, dict):
            inp = CustomCharacterInput.model_validate(item)
        elif isinstance(item, CustomCharacterInput):
            inp = item
        else:
            continue

        raw_name = inp.name.strip()
        slug = re.sub(r"[^a-zA-Z0-9_]", "", raw_name.lower().replace(" ", "_")) or f"char_{idx+1}"

        # Assign voice with rotation fallback
        assigned_voice = inp.voice or DEFAULT_VOICE_ROTATION[idx % len(DEFAULT_VOICE_ROTATION)]

        # Assign subtitle color with rotation fallback
        assigned_color = inp.subtitle_color or DEFAULT_COLOR_ROTATION[idx % len(DEFAULT_COLOR_ROTATION)]

        # Process reference image if provided
        saved_img_path: Optional[Path] = None
        if inp.image_data:
            saved_img_path = save_character_image(inp.image_data, slug)

        # Extract Visual DNA
        if saved_img_path:
            visual_dna = extract_visual_dna_from_image(
                image_path=saved_img_path,
                character_name=raw_name,
                visual_notes=inp.visual_notes,
                api_key=api_key,
            )
        elif inp.visual_notes and inp.visual_notes.strip():
            visual_dna = f"{raw_name}: {inp.visual_notes.strip()}"
        else:
            visual_dna = f"{raw_name}: Distinctive dynamic animated appearance with expressive features."

        char = Character(
            id=slug,
            name=raw_name,
            voice=assigned_voice,
            pitch="+0Hz",
            rate="+0%",
            visual_dna=visual_dna,
            subtitle_color=assigned_color,
            image_url=str(saved_img_path) if saved_img_path else None,
        )
        characters.append(char)

    return characters
