"""LLM Scripting module using Google Gemini API."""
import logging
from typing import Optional
from google import genai
from google.genai import types

from engine.config import GEMINI_API_KEY, GEMINI_MODELS
from engine.schema import VideoScript

logger = logging.getLogger(__name__)

SYSTEM_INSTRUCTION = """You are an elite short-form viral video director and scriptwriter for platforms like TikTok, YouTube Shorts, and Instagram Reels.

Your mission is to craft high-retention, engaging video scripts adhering strictly to these rules:
1. Hook in Scene 1: The very first 3 seconds must grab the viewer's attention with an intriguing question, mind-blowing fact, or bold claim.
2. Conversational & Human Narration: Write narration that sounds like a real person talking directly to a friend — natural, expressive, and compelling. Avoid robotic lists, dry encyclopedia summaries, or stiff corporate jargon. Use natural pauses (commas, ellipses, em-dashes) and conversational transitions ("Here's the wild part...", "Think about that for a second.", "Now imagine...").
3. Rhythm & Cadence: Vary sentence lengths so the voiceover has a natural human heartbeat — mix punchy short phrases with flowing descriptive statements.
4. Scene Pacing: Each scene should be 3-6 seconds of spoken narration (roughly 8-16 words per scene).
5. Total Length: Total script duration should match the requested target duration.
6. Stock Search Keywords: Provide 2-4 literal, visual, high-yield stock search keywords per scene. Never use abstract concepts as search keywords (e.g. use "underwater dark deep sea" instead of "mystery of the abyss"). Focus on nouns, camera angles, and lighting that exist in stock video libraries like Pexels.
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
) -> VideoScript:
    """Generate a structured video script using the Gemini API.

    Args:
        topic: The topic or concept for the video.
        target_duration: Approximate target length in seconds (default: 30).
        target_scenes: Optional number of scenes (defaults to duration // 5).
        api_key: Optional override for Gemini API key.
        preferred_model: Optional override for preferred Gemini model.

    Returns:
        VideoScript: Strictly validated Pydantic model instance.
    """
    client = get_gemini_client(api_key)

    num_scenes = target_scenes or max(3, target_duration // 5)

    # Calibrate word pacing: spoken English averages ~2.5 words per second
    target_words = int(target_duration * 2.5)
    words_per_scene = max(8, round(target_words / num_scenes))

    prompt = f"""Topic: {topic}
Target Duration: approximately {target_duration} seconds.
Target Scenes: exactly {num_scenes} scenes.
Target Total Spoken Words: approximately {target_words} words across all {num_scenes} scenes (~{words_per_scene} words per scene).

CRITICAL: The narration must be substantial enough to fill the full {target_duration}-second runtime when spoken aloud at a natural pace (~2.5 words per second). Each scene's narration should average {words_per_scene} words. Do NOT write terse one-liners.

Generate a complete, captivating short-form video script with title, description, tags, and {num_scenes} scenes.
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
