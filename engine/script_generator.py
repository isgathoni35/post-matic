"""LLM Scripting module using Google Gemini API."""
import logging
from typing import List, Optional
from google import genai
from google.genai import types

from engine.config import GEMINI_API_KEY, GEMINI_MODELS
from engine.schema import VideoScript, AnimatedStoryScript, Character

logger = logging.getLogger(__name__)

SYSTEM_INSTRUCTION = """You are an elite viral video director and scriptwriter for short-form platforms (TikTok, YouTube Shorts, Instagram Reels).

Your mission is to craft scripts that sound 100% human, authentic, and high-retention:
1. Hook in Scene 1: The very first 3 seconds must grab the viewer instantly with an intriguing question, mind-bending fact, or bold claim.
2. Natural Spoken Dialogue: Write how real charismatic humans talk to friends — NOT how textbooks or AI bots write.
   - ALWAYS use spoken contractions (e.g. "it's", "don't", "can't", "you'd", "we've", "here's") rather than stiff formal words ("it is", "do not", "cannot").
   - Use natural breath pauses and emotional pacing: use commas for natural breaths, em-dashes (" — ") for dramatic pauses, ellipses ("...") for suspense, and rhetorical questions ("?") for vocal lift.
   - Use conversational transitions: "Here's the wild part...", "Think about this for a second...", "Now imagine...", "Wait until you hear this...".
3. Rhythm & Human Heartbeat: Alternate short, punchy sentence fragments (3-5 words) with smooth descriptive lines (8-12 words). Avoid monotonic run-on sentences.
4. Scene Pacing: Each scene should contain 3-6 seconds of spoken narration (roughly 8-16 words per scene).
5. Total Length: Total script duration should match the requested target duration.
6. Stock Search Keywords: Provide 2-4 concrete, visual, high-yield search keywords per scene (nouns, lighting, camera actions in stock libraries like Pexels). Avoid abstract buzzwords.
"""


def get_gemini_client(api_key: Optional[str] = None) -> genai.Client:
    """Initialize and return a Google GenAI client."""
    key = api_key or GEMINI_API_KEY
    if not key:
        raise ValueError(
            "Gemini API Key is missing. Please set GEMINI_API_KEY in your .env file."
        )
    return genai.Client(api_key=key)


def generate_script(
    topic: str,
    target_duration: int = 30,
    target_scenes: Optional[int] = None,
    api_key: Optional[str] = None,
    preferred_model: Optional[str] = None,
    series_context: Optional[str] = None,
) -> VideoScript:
    """Generate a structured video script using the Gemini API.

    Args:
        topic: The topic or concept for the video.
        target_duration: Approximate target length in seconds (default: 30).
        target_scenes: Optional number of scenes (defaults to duration // 5).
        api_key: Optional override for Gemini API key.
        preferred_model: Optional override for preferred Gemini model.
        series_context: Optional Show Bible continuity context for episodic series.

    Returns:
        VideoScript: Strictly validated Pydantic model instance.
    """
    client = get_gemini_client(api_key)

    num_scenes = target_scenes or max(3, target_duration // 5)

    # Calibrate word pacing: spoken English averages ~2.5 words per second
    target_words = int(target_duration * 2.5)
    words_per_scene = max(8, round(target_words / num_scenes))

    series_prefix = f"{series_context}\n\n" if series_context else ""

    prompt = f"""{series_prefix}Topic: {topic}
Target Duration: approximately {target_duration} seconds.
Target Scenes: exactly {num_scenes} scenes.
Target Total Spoken Words: approximately {target_words} words across all {num_scenes} scenes (~{words_per_scene} words per scene).

CRITICAL: The narration must be substantial enough to fill the full {target_duration}-second runtime when spoken aloud at a natural pace (~2.5 words per second). Each scene's narration should average {words_per_scene} words. Do NOT write terse one-liners.

Generate a complete, captivating short-form video script with title, description, tags, and {num_scenes} scenes.
Ensure the narration sounds like an engaging human narrator with contractions, expressive pauses (..., —, ?), and strong hooks.
Ensure search_keywords are concrete visual search queries that yield great results on Pexels."""

    models_to_try = [preferred_model] if preferred_model else []
    for m in GEMINI_MODELS:
        if m not in models_to_try:
            models_to_try.append(m)

    last_error = None
    for model_name in models_to_try:
        try:
            logger.info("Attempting script generation with model: %s", model_name)
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=VideoScript,
                    system_instruction=SYSTEM_INSTRUCTION,
                    temperature=0.7,
                ),
            )

            # Response parsed into Pydantic model
            if response.parsed and isinstance(response.parsed, VideoScript):
                return response.parsed

            # Fallback if parsed is a dict
            if isinstance(response.parsed, dict):
                return VideoScript.model_validate(response.parsed)

            # Fallback: parse text as JSON into Pydantic model
            if response.text:
                return VideoScript.model_validate_json(response.text)

            raise ValueError("Empty response received from Gemini API.")

        except Exception as e:
            logger.warning("Generation with model '%s' failed: %s", model_name, e)
            last_error = e
            continue

    raise RuntimeError(
        f"Failed to generate script across all candidate models. Last error: {last_error}"
    )


STORY_SYSTEM_INSTRUCTION = """You are an award-winning animation director and screenplay writer for viral animated short videos across YouTube Shorts, TikTok, and Instagram Reels.
You specialize in diverse animation styles: Japanese Anime, Chinese 3D Donghua, Stickman Action combat, and 3D Feature Animation (e.g. comedic Shrek & Donkey style adventures).

Your mission is to construct captivating, multi-character animated screenplays with dynamic dialogue, vocal personas, and action sound effect cues:

1. Character Cast:
   - Establish 2 to 3 vivid characters with contrasting personalities (e.g., serious hero vs quirky sidekick, martial arts rivals, ogre vs donkey).
   - Assign appropriate edge-tts voices and pitch/rate adjustments:
     * Deep/Authoritative/Ogre: "en-US-ChristopherNeural" (pitch: "-4Hz" or "-5Hz")
     * Energetic/Comedic/Sidekick: "en-US-GuyNeural" (pitch: "+3Hz", rate: "+8%")
     * Conversational Hero: "en-US-BrianMultilingualNeural" (pitch: "-1Hz")
     * Expressive Heroine/Mage: "en-US-AvaMultilingualNeural" (pitch: "+1Hz")
     * British Mentor/Elder: "en-GB-SoniaNeural"
     * Dynamic Podcast/Young Hero: "en-US-AndrewMultilingualNeural"
   - Anchor each character with a distinct 'visual_dna' description (clothing, hair, facial features, species/build) to keep character appearance 100% consistent across all scenes.
   - Assign distinct high-contrast hex subtitle colors per character (e.g. #22C55E for green/nature characters, #F59E0B for energetic amber, #38BDF8 for cyber cyan, #F43F5E for rose/intense, #E2E8F0 for crisp white).

2. Natural Spoken Dialogue:
   - Write vibrant back-and-forth conversation with realistic human delivery.
   - Use spoken contractions ("don't", "can't", "you'd", "we've", "it's").
   - Include emotional inflection, rapid comedic banter or intense combat rivalries, and dramatic pauses (..., —, ?).

3. Action Sound Effects (SFX / Foley) Cues:
   - Embed realistic action SFX cues at key dialogue beats:
     * Combat & Impacts: 'punch_heavy', 'punch_light', 'slap', 'sword_clash', 'body_slam'
     * Superhero & Movement: 'flight_whoosh', 'sonic_boom', 'superman_takeoff', 'teleport_zap', 'fast_footsteps'
     * Foley & Humor: 'glass_clink', 'door_slam', 'record_scratch', 'gulp', 'explosion_cinematic'
   - Set offset_seconds relative to the start of each dialogue line.

4. Consistent Environment & Dynamic Camera:
   - Maintain the same 'environment_anchor' across scenes in the same location (e.g. 'Swamp shack at twilight', 'Neo-Tokyo rooftop in rain', 'Ancient martial arts mountaintop').
   - Specify dynamic camera movement: 'zoom_in_punch', 'action_shake', 'whoosh_pan_up', 'pan_left', 'slow_push_in'.
"""


def _reconcile_characters(
    story: AnimatedStoryScript,
    custom_characters: Optional[List[Character]] = None,
) -> AnimatedStoryScript:
    """Ensure user-defined custom characters and their exact attributes are preserved."""
    if not custom_characters:
        return story

    custom_by_id = {c.id.lower(): c for c in custom_characters}
    custom_by_name = {c.name.lower(): c for c in custom_characters}

    merged_characters: List[Character] = list(custom_characters)
    merged_ids = {c.id.lower() for c in merged_characters}

    for c in story.characters:
        if c.id.lower() not in merged_ids and c.name.lower() not in custom_by_name:
            merged_characters.append(c)
            merged_ids.add(c.id.lower())

    story.characters = merged_characters
    return story


def generate_story_script(
    topic: str,
    style: str = "anime",
    target_duration: int = 30,
    target_scenes: Optional[int] = None,
    custom_characters: Optional[List[Character]] = None,
    api_key: Optional[str] = None,
    preferred_model: Optional[str] = None,
    series_context: Optional[str] = None,
) -> AnimatedStoryScript:
    """Generate a structured multi-character animated screenplay using the Gemini API.

    Args:
        topic: The story premise (e.g. 'Shrek and Donkey discover a cyberpunk artifact in the swamp').
        style: Aesthetic genre ('anime', 'donghua', 'stickman', '3d_cartoon').
        target_duration: Approximate target length in seconds (default: 30).
        target_scenes: Optional number of scenes (defaults to duration // 7).
        custom_characters: Optional user-provided custom cast with visual DNA and assigned voices.
        api_key: Optional override for Gemini API key.
        preferred_model: Optional override for preferred Gemini model.
        series_context: Optional Show Bible continuity context for episodic series.

    Returns:
        AnimatedStoryScript: Strictly validated Pydantic model instance with cast, dialogue, and SFX cues.
    """
    client = get_gemini_client(api_key)

    num_scenes = target_scenes or max(2, target_duration // 7)

    cast_clause = ""
    if custom_characters:
        cast_lines = [
            f"  - Character ID: '{c.id}', Name: '{c.name}', Voice: '{c.voice}', Subtitle Color: '{c.subtitle_color}', Visual DNA: '{c.visual_dna}'"
            for c in custom_characters
        ]
        cast_clause = "\nSTRICT CAST DIRECTIVE:\nThe screenplay MUST exclusively star the following user-defined cast:\n" + "\n".join(cast_lines) + "\nIn the returned 'characters' list, you MUST preserve these exact characters with their identical IDs, names, and visual DNA. All dialogue lines must be assigned to these characters using their exact 'speaker_id'.\n"

    series_prefix = f"{series_context}\n\n" if series_context else ""

    prompt = f"""{series_prefix}Topic: {topic}
Animation Style: {style} (e.g. 'anime', 'donghua', 'stickman', or '3d_cartoon')
Target Total Duration: approximately {target_duration} seconds.
Target Scenes: exactly {num_scenes} scenes.{cast_clause}

Generate a complete, captivating multi-character animated screenplay with a full cast, multi-turn dialogue, embedded action SFX cues (such as punch_heavy, flight_whoosh, glass_clink, etc.), consistent character visual_dna anchors, and environment_anchor settings.
Ensure the dialogue is punchy, authentic, comedic or intense according to the topic, and includes natural human contractions and expressive pauses."""

    models_to_try = [preferred_model] if preferred_model else []
    for m in GEMINI_MODELS:
        if m not in models_to_try:
            models_to_try.append(m)

    last_error = None
    for model_name in models_to_try:
        try:
            logger.info("Attempting story script generation with model: %s", model_name)
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=AnimatedStoryScript,
                    system_instruction=STORY_SYSTEM_INSTRUCTION,
                    temperature=0.75,
                ),
            )

            # Response parsed into Pydantic model
            if response.parsed and isinstance(response.parsed, AnimatedStoryScript):
                return _reconcile_characters(response.parsed, custom_characters)

            # Fallback if parsed is a dict
            if isinstance(response.parsed, dict):
                story = AnimatedStoryScript.model_validate(response.parsed)
                return _reconcile_characters(story, custom_characters)

            # Fallback: parse text as JSON into Pydantic model
            if response.text:
                story = AnimatedStoryScript.model_validate_json(response.text)
                return _reconcile_characters(story, custom_characters)

            raise ValueError("Empty response received from Gemini API.")

        except Exception as e:
            logger.warning("Story generation with model '%s' failed: %s", model_name, e)
            last_error = e
            continue

    raise RuntimeError(
        f"Failed to generate story script across all candidate models. Last error: {last_error}"
    )


if __name__ == "__main__":
    import sys
    test_topic = sys.argv[1] if len(sys.argv) > 1 else "Why the Mariana Trench is terrifying"
    print(f"Generating test script for: '{test_topic}'...")
    script = generate_script(topic=test_topic, target_duration=25)
    print("\n=== GENERATED SCRIPT ===")
    print(f"Title: {script.title}")
    print(f"Description: {script.description}")
    print(f"Tags: {', '.join(script.tags)}")
    print(f"\nScenes ({len(script.scenes)}):")
    for s in script.scenes:
        print(f"\n[Scene {s.scene_id}]")
        print(f"  Narration: {s.narration}")
        print(f"  Visual:    {s.visual_description}")
        print(f"  Keywords:  {s.search_keywords}")
