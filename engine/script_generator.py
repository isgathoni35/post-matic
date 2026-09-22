"""LLM Scripting module using Google Gemini API."""
import logging
import time
from typing import List, Optional
from google import genai
from google.genai import types

from engine.config import GEMINI_API_KEY, GEMINI_MODELS
from engine.schema import VideoScript, Scene, AnimatedStoryScript, StoryScene, DialogueLine, SFXCue, Character

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

VIRAL_NICHE_CONFIGS = {
    "scary_stories": {
        "name": "Scary Stories & Creepypasta",
        "hook_formula": (
            "Scene 1 MUST deliver a chilling, curiosity-inducing hook within the first 3 seconds "
            "(e.g. 'In October 2017, a hiker vanished off trail 9... what authorities recovered from his phone wasn't human.')."
        ),
        "tone_rules": (
            "Dread, suspense, creeping mystery. Use short, breath-catching sentences. "
            "Use ellipses (...) and em-dashes (—) for tense pauses. Never use upbeat or cheerful language. "
            "End with an unsettling lingering question that forces comments."
        ),
        "visual_guidance": "Dark, fog-drenched woods, flickering flashlights, abandoned hallways, shadows moving in peripheral vision.",
    },
    "mythology": {
        "name": "Mythology & Ancient Gods",
        "hook_formula": (
            "Scene 1 MUST open with a clash of titans or an ominous divine edict "
            "(e.g. 'The gods didn't banish Prometheus for giving fire to humans. They banished him for what he stole next.')."
        ),
        "tone_rules": (
            "Majestic, booming, awe-inspiring, fateful. Grand descriptive adjectives, mythic stakes, "
            "and thunderous transitions. Emphasize ancient consequences and divine hubris."
        ),
        "visual_guidance": "Golden temples atop storm-swept mountains, crackling divine lightning, ancient marble ruins, ethereal auras.",
    },
    "school_gossip": {
        "name": "School Gossip & Secret Confessions",
        "hook_formula": (
            "Scene 1 MUST ignite immediate dramatic conflict and relatable disbelief "
            "(e.g. 'My best friend swore she was sick on Friday... until I saw her location at my boyfriend's apartment.')."
        ),
        "tone_rules": (
            "Fast first-person monologue, high-energy conversational contractions ('she'd', 'I couldn't', 'wait for it'), "
            "rapid-fire gossip pacing, interpersonal stakes, and an unresolved moral cliffhanger."
        ),
        "visual_guidance": "High school locker corridors, glowing smartphone text bubbles, classroom whispers, late-night suburban streets.",
    },
    "dark_history": {
        "name": "Dark History & Unsolved Truths",
        "hook_formula": (
            "Scene 1 MUST shatter a widely held historical misconception with an unsettling counter-intuitive fact "
            "(e.g. 'Every textbook tells you Napoleon died of illness in exile. But his autopsy hid a terrifying secret.')."
        ),
        "tone_rules": (
            "Cold, forensic, investigative, sharp. Lay out chronological revelations like an elite documentary investigator. "
            "Alternate factual evidence with shocking human details."
        ),
        "visual_guidance": "Sepia archival manuscripts, antique clocks, vintage European battlefields shrouded in smoke, classified dossier vaults.",
    },
    "heists": {
        "name": "Heists & Masterminds",
        "hook_formula": (
            "Scene 1 MUST detail an impossible security breach with zero detection "
            "(e.g. 'They walked out of the Antwerp diamond center with 100 million dollars in jewels. Not a single alarm tripped.')."
        ),
        "tone_rules": (
            "Calculated, pulse-pounding, rhythmic clock-ticking tension. Break down the precision blueprint step-by-step. "
            "Highlight the mastermind's psychological loophole."
        ),
        "visual_guidance": "Laser grids in fortified vaults, blueprint schematics on metallic desks, security camera feeds, gloved hands in shadow.",
    },
    "anime_lore": {
        "name": "Anime Battles & Lore",
        "hook_formula": (
            "Scene 1 MUST present an unfathomable power feat or broken ability "
            "(e.g. 'He spent 10 years mastering a forbidden blade stance... and in 0.4 seconds, dismantled an entire army.')."
        ),
        "tone_rules": (
            "Adrenaline-fueled, dramatic hype, high-intensity vocal pacing. Emphasize power escalation, "
            "philosophical clashes of ideals, and legendary techniques."
        ),
        "visual_guidance": "Glowing energy auras, lightning-fast katana strikes, dimensional rifts, cel-shaded Japanese battle keyframes.",
    },
    "kindness": {
        "name": "Acts of Kindness & Hope",
        "hook_formula": (
            "Scene 1 MUST introduce an unsung hero facing heartbreaking odds "
            "(e.g. 'He spent 30 years baking bread for neighborhood kids... until the morning his bakery burned to the ground.')."
        ),
        "tone_rules": (
            "Warm, deeply empathetic, emotionally resonant crescendo. Build genuine tears and goosebumps, "
            "culminating in an uplifting twist that inspires viewers to share."
        ),
        "visual_guidance": "Warm golden sunlight, humble storefronts, compassionate embraces, communities gathering, tears of gratitude.",
    },
    "stickman": {
        "name": "Stickman Viral Drama & Action",
        "hook_formula": (
            "Scene 1 MUST launch straight into chaotic martial arts acrobatics or snappy comedic banter "
            "(e.g. 'Red Stickman challenged the Grand Master with nothing but a wooden ruler. It did not go as planned.')."
        ),
        "tone_rules": (
            "Fast-paced, witty, comedic banter, sudden martial arts escalation, kinetic cartoon timing, "
            "and hilarious unexpected twist endings."
        ),
        "visual_guidance": "Minimalist clean background, glowing neon stick figure martial artists, acrobatic aerial kicks, energy trails.",
    },
}


def get_gemini_client(api_key: Optional[str] = None) -> genai.Client:
    """Initialize and return a Google GenAI client."""
    key = api_key or GEMINI_API_KEY
    if not key:
        raise ValueError(
            "Gemini API Key is missing. Please set GEMINI_API_KEY in your .env file."
        )
    return genai.Client(api_key=key)


def _clean_json_str(raw: str) -> str:
    """Strip markdown backticks and clean JSON text string."""
    raw = raw.strip()
    if raw.startswith("```json"):
        raw = raw[7:]
    elif raw.startswith("```"):
        raw = raw[3:]
    if raw.endswith("```"):
        raw = raw[:-3]
    return raw.strip()


def generate_script(
    topic: str,
    target_duration: int = 30,
    target_scenes: Optional[int] = None,
    api_key: Optional[str] = None,
    preferred_model: Optional[str] = None,
    series_context: Optional[str] = None,
    niche: Optional[str] = None,
) -> VideoScript:
    """Generate a structured video script using the Gemini API.

    Args:
        topic: The topic or concept for the video.
        target_duration: Approximate target length in seconds (default: 30).
        target_scenes: Optional number of scenes (defaults to duration // 5).
        api_key: Optional override for Gemini API key.
        preferred_model: Optional override for preferred Gemini model.
        series_context: Optional Show Bible continuity context for episodic series.
        niche: Optional pre-engineered viral niche key with retention formula.

    Returns:
        VideoScript: Strictly validated Pydantic model instance.
    """
    client = get_gemini_client(api_key)

    # Scale scene pacing for longer videos to prevent exceeding LLM context
    if target_duration > 180:
        scene_len = 15
    elif target_duration > 60:
        scene_len = 10
    else:
        scene_len = 5
        
    num_scenes = target_scenes or max(3, target_duration // scene_len)

    # Calibrate word pacing: spoken English averages ~2.5 words per second
    target_words = int(target_duration * 2.5)
    words_per_scene = max(8, round(target_words / num_scenes))

    series_prefix = f"{series_context}\n\n" if series_context else ""

    niche_clause = ""
    if niche and niche.lower() in VIRAL_NICHE_CONFIGS:
        cfg = VIRAL_NICHE_CONFIGS[niche.lower()]
        niche_clause = (
            f"\nVIRAL RETENTION NICHE DIRECTIVE ({cfg['name']}):\n"
            f"- Hook Rule: {cfg['hook_formula']}\n"
            f"- Pacing & Tone: {cfg['tone_rules']}\n"
            f"- Visual Focus: {cfg['visual_guidance']}\n"
        )

    prompt = f"""{series_prefix}Topic: {topic}
Target Duration: approximately {target_duration} seconds.
Target Scenes: exactly {num_scenes} scenes.
Target Total Spoken Words: approximately {target_words} words across all {num_scenes} scenes (~{words_per_scene} words per scene).{niche_clause}

CRITICAL: The narration must be substantial enough to fill the full {target_duration}-second runtime when spoken aloud at a natural pace (~2.5 words per second). Each scene's narration should average {words_per_scene} words. Do NOT write terse one-liners.

Generate a complete, captivating short-form video script with title, description, tags, and {num_scenes} scenes.
Ensure the narration sounds like an engaging human narrator with contractions, expressive pauses (..., —, ?), and strong hooks.
Ensure search_keywords are concrete visual search queries that yield great results on Pexels."""


    models_to_try = [preferred_model] if preferred_model else []
    for m in GEMINI_MODELS:
        if m not in models_to_try:
            models_to_try.append(m)

    last_error = None
    max_retries = 3

    for model_name in models_to_try:
        retries = 0
        while retries <= max_retries:
            try:
                logger.info("Attempting script generation with model: %s (attempt %d)", model_name, retries + 1)
                
                if model_name.startswith("gemma"):
                    gemma_prompt = (
                        f"You are a viral video scriptwriter. Topic: '{topic}'.\n"
                        f"Create a captivating {target_duration}-second script with exactly {num_scenes} scenes.\n"
                        "Return ONLY a valid JSON object matching this exact schema without any markdown formatting or commentary outside the JSON block:\n"
                        "{\n"
                        '  "title": "Short catchy title",\n'
                        '  "description": "Engaging description with hashtags",\n'
                        '  "tags": ["tag1", "tag2", "tag3"],\n'
                        '  "scenes": [\n'
                        '    {\n'
                        '      "scene_id": 1,\n'
                        '      "narration": "Natural spoken conversational narration with contractions.",\n'
                        '      "visual_description": "Clear cinematic visual description.",\n'
                        '      "search_keywords": ["keyword 1", "keyword 2"]\n'
                        '    }\n'
                        '  ]\n'
                        "}\n"
                    )
                    response = client.models.generate_content(
                        model=model_name,
                        contents=gemma_prompt,
                    )
                    cleaned = _clean_json_str(response.text or "")
                    return VideoScript.model_validate_json(cleaned)

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
                    cleaned = _clean_json_str(response.text)
                    return VideoScript.model_validate_json(cleaned)

                raise ValueError("Empty response received from Gemini API.")

            except Exception as e:
                err_msg = str(e)
                if "RESOURCE_EXHAUSTED" in err_msg:
                    logger.warning("Model '%s' quota exhausted, falling back to next candidate model immediately.", model_name)
                    last_error = e
                    break
                if retries < max_retries and any(err in err_msg for err in ["503", "429", "UNAVAILABLE"]):
                    sleep_time = 2.0 * (2 ** retries)
                    logger.warning("Model '%s' returned 503/429. Retrying in %.1f seconds...", model_name, sleep_time)
                    time.sleep(sleep_time)
                    retries += 1
                    continue

                logger.warning("Generation with model '%s' failed: %s", model_name, e)
                last_error = e
                break

    logger.warning("All LLM candidate models exhausted or unavailable (%s). Activating high-retention fallback script generator for topic: '%s'", last_error, topic)
    return _build_fallback_video_script(topic=topic, target_duration=target_duration, num_scenes=num_scenes)


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
    niche: Optional[str] = None,
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
        niche: Optional pre-engineered viral niche key with retention formula.

    Returns:
        AnimatedStoryScript: Strictly validated Pydantic model instance with cast, dialogue, and SFX cues.
    """
    client = get_gemini_client(api_key)

    # Scale scene pacing for longer stories to prevent exceeding LLM context
    if target_duration > 180:
        scene_len = 15
    elif target_duration > 60:
        scene_len = 10
    else:
        scene_len = 7

    num_scenes = target_scenes or max(2, target_duration // scene_len)

    cast_clause = ""
    if custom_characters:
        cast_lines = [
            f"  - Character ID: '{c.id}', Name: '{c.name}', Voice: '{c.voice}', Subtitle Color: '{c.subtitle_color}', Visual DNA: '{c.visual_dna}'"
            for c in custom_characters
        ]
        cast_clause = "\nSTRICT CAST DIRECTIVE:\nThe screenplay MUST exclusively star the following user-defined cast:\n" + "\n".join(cast_lines) + "\nIn the returned 'characters' list, you MUST preserve these exact characters with their identical IDs, names, and visual DNA. All dialogue lines must be assigned to these characters using their exact 'speaker_id'.\n"

    series_prefix = f"{series_context}\n\n" if series_context else ""

    niche_clause = ""
    if niche and niche.lower() in VIRAL_NICHE_CONFIGS:
        cfg = VIRAL_NICHE_CONFIGS[niche.lower()]
        niche_clause = (
            f"\nVIRAL RETENTION NICHE DIRECTIVE ({cfg['name']}):\n"
            f"- Hook Rule: {cfg['hook_formula']}\n"
            f"- Pacing & Banter: {cfg['tone_rules']}\n"
        )

    style_directives = {
        "stickman": (
            "CRITICAL STYLE REQUIREMENT FOR STICKMAN:\n"
            "- All characters MUST be 2D minimalist line stick figures (Alan Becker animator vs animation style).\n"
            "- Characters have blank spherical heads, thin line bodies/limbs, and distinct neon or monochrome colors (e.g. 'Red Stickman: pure glowing neon-crimson line figure with circle head', 'Blue Stickman: pure glowing cyan-blue line figure with circle head').\n"
            "- STRICTLY FORBIDDEN: DO NOT include human hair, realistic human skin, human eyes, denim jackets, or realistic clothing in any character's 'visual_dna'.\n"
            "- In every scene's 'visual_description', depict dynamic stick figure acrobatic martial arts, combat maneuvers, or energy attacks—NEVER realistic human people."
        ),
        "anime": (
            "CRITICAL STYLE REQUIREMENT FOR ANIME:\n"
            "- All characters MUST be 2D Japanese anime cel-shaded illustrations (Studio MAPPA and Ufotable aesthetic).\n"
            "- Visual DNA must emphasize stylized 2D anime hair, expressive anime features, and colorful anime attire.\n"
            "- In every scene's 'visual_description', focus on dynamic 2D anime action lines, dramatic framing, and non-photorealistic illustrations—NEVER live-action or photorealistic humans."
        ),
        "donghua": (
            "CRITICAL STYLE REQUIREMENT FOR DONGHUA:\n"
            "- Characters MUST be stylized 3D Chinese cultivation fantasy (xianxia) animated characters with luminous martial auras, ethereal flowing robes, and CGI features."
        ),
        "3d_cartoon": (
            "CRITICAL STYLE REQUIREMENT FOR 3D CARTOON:\n"
            "- Characters MUST be stylized 3D cartoon characters with Pixar/DreamWorks exaggerated proportions, whimsical features, and vibrant storybook CGI textures."
        ),
    }
    style_guide = style_directives.get(style.lower(), "")
    style_block = f"\n\n{style_guide}\n" if style_guide else ""

    prompt = f"""{series_prefix}Topic: {topic}
Animation Style: {style} (e.g. 'anime', 'donghua', 'stickman', or '3d_cartoon')
Target Total Duration: approximately {target_duration} seconds.
Target Scenes: exactly {num_scenes} scenes.{cast_clause}{style_block}{niche_clause}

Generate a complete, captivating multi-character animated screenplay with a full cast, multi-turn dialogue, embedded action SFX cues (such as punch_heavy, flight_whoosh, glass_clink, etc.), consistent character visual_dna anchors, and environment_anchor settings.
Ensure the dialogue is punchy, authentic, comedic or intense according to the topic, and includes natural human contractions and expressive pauses."""

    models_to_try = [preferred_model] if preferred_model else []
    for m in GEMINI_MODELS:
        if m not in models_to_try:
            models_to_try.append(m)

    last_error = None
    max_retries = 3

    for model_name in models_to_try:
        retries = 0
        while retries <= max_retries:
            try:
                logger.info("Attempting story script generation with model: %s (attempt %d)", model_name, retries + 1)
                
                if model_name.startswith("gemma"):
                    gemma_prompt = (
                        f"Topic: '{topic}'. Animation Style: '{style}'.\n"
                        f"Duration: approximately {target_duration} seconds. Target scenes: {num_scenes}.\n"
                        "Output ONLY a valid JSON object matching this AnimatedStoryScript schema without any markdown or commentary outside the JSON block:\n"
                        "{\n"
                        '  "title": "Title here",\n'
                        '  "description": "Description here",\n'
                        '  "tags": ["tag1", "tag2"],\n'
                        '  "characters": [\n'
                        '    {"id": "char1", "name": "Name", "voice": "en-US-BrianMultilingualNeural", "pitch": "+0Hz", "rate": "+0%", "visual_dna": "Visual appearance"}\n'
                        '  ],\n'
                        '  "scenes": [\n'
                        '    {\n'
                        '      "scene_id": 1,\n'
                        '      "dialogues": [\n'
                        '        {"speaker_id": "char1", "text": "Dialogue text", "action_sfx": "punch_heavy"}\n'
                        '      ],\n'
                        '      "visual_description": "Scene visual action",\n'
                        '      "environment_anchor": "Dark alley at night"\n'
                        '    }\n'
                        '  ]\n'
                        "}\n"
                    )
                    response = client.models.generate_content(
                        model=model_name,
                        contents=gemma_prompt,
                    )
                    cleaned = _clean_json_str(response.text or "")
                    story = AnimatedStoryScript.model_validate_json(cleaned)
                    return _reconcile_characters(story, custom_characters)

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
                    cleaned = _clean_json_str(response.text)
                    story = AnimatedStoryScript.model_validate_json(cleaned)
                    return _reconcile_characters(story, custom_characters)

                raise ValueError("Empty response received from Gemini API.")

            except Exception as e:
                err_msg = str(e)
                if "RESOURCE_EXHAUSTED" in err_msg:
                    logger.warning("Story model '%s' quota exhausted, falling back to next candidate model immediately.", model_name)
                    last_error = e
                    break
                if retries < max_retries and any(err in err_msg for err in ["503", "429", "UNAVAILABLE"]):
                    sleep_time = 2.0 * (2 ** retries)
                    logger.warning("Model '%s' returned 503/429. Retrying in %.1f seconds...", model_name, sleep_time)
                    time.sleep(sleep_time)
                    retries += 1
                    continue

                logger.warning("Story generation with model '%s' failed: %s", model_name, e)
                last_error = e
                break

    logger.warning("All story LLM candidate models exhausted or unavailable (%s). Activating fallback story script generator for topic: '%s'", last_error, topic)
    fallback_story = _build_fallback_story_script(topic=topic, target_duration=target_duration, num_scenes=num_scenes, style=style, custom_characters=custom_characters)
    return _reconcile_characters(fallback_story, custom_characters)


def _build_fallback_video_script(topic: str, target_duration: int = 25, num_scenes: int = 3) -> VideoScript:
    """Generate a high-retention fallback script when all cloud LLM endpoints hit 503/429."""
    clean_topic = topic.strip().strip("'\"")
    words = [w for w in clean_topic.split() if w.isalnum()]
    base_keywords = words[:3] if words else ["cinematic", "nature", "epic"]
    kw_str = " ".join(base_keywords)

    scenes_data = [
        (
            f"Here's the wild truth about {clean_topic} that almost nobody talks about.",
            f"Dramatic cinematic opening revealing the mysterious world of {clean_topic}",
            [f"{kw_str} cinematic", f"{clean_topic} discovery", "dramatic lighting"]
        ),
        (
            f"When researchers explored deeper into {clean_topic}, what they uncovered defied every previous expectation.",
            f"High-detail investigative visual showing the complex layers of {clean_topic}",
            [f"{kw_str} macro", "scientific research", "fascinating revelation"]
        ),
        (
            f"This completely shifts our perspective on {clean_topic}. Which detail surprised you the most? Drop your thoughts below.",
            f"Stunning panoramic conclusion with glowing ambient light and cinematic motion",
            [f"{kw_str} aerial", "epic horizon", "inspiring landscape"]
        )
    ]

    selected_scenes = []
    for i in range(max(3, num_scenes)):
        tmpl_idx = i % len(scenes_data)
        narr, vis, kws = scenes_data[tmpl_idx]
        selected_scenes.append(
            Scene(
                scene_id=i + 1,
                narration=narr,
                visual_description=vis,
                search_keywords=kws,
            )
        )

    title = f"The Untold Truth About {clean_topic.title()}"[:100]
    desc = f"Uncovering the mind-blowing secrets of {clean_topic}. Watch until the end! #shorts #viral #facts"
    tags = [w.lower() for w in words if len(w) > 3][:6] + ["shorts", "viral", "documentary"]

    return VideoScript(
        title=title,
        description=desc,
        tags=tags,
        scenes=selected_scenes,
    )


def _build_fallback_story_script(
    topic: str,
    target_duration: int = 30,
    num_scenes: int = 3,
    style: str = "anime",
    custom_characters: Optional[List[Character]] = None,
) -> AnimatedStoryScript:
    """Generate a fallback multi-character screenplay when all LLMs hit 503/429."""
    chars = custom_characters or [
        Character(
            id="char1",
            name="Protagonist",
            voice="en-US-BrianMultilingualNeural",
            visual_dna=f"Dynamic stylized {style} hero with determined expression",
            subtitle_color="#22C55E",
        ),
        Character(
            id="char2",
            name="Rival",
            voice="en-US-ChristopherNeural",
            visual_dna=f"Formidable {style} rival with glowing battle aura",
            subtitle_color="#F59E0B",
        ),
    ]
    spk1 = chars[0].id
    spk2 = chars[1].id if len(chars) > 1 else chars[0].id

    scenes = []
    for i in range(max(3, num_scenes)):
        scenes.append(
            StoryScene(
                scene_id=i + 1,
                dialogue=[
                    DialogueLine(
                        line_id=1,
                        speaker_id=spk1,
                        text=f"This is where the real battle begins for {topic}!",
                        emotion="urgent",
                        sfx=[SFXCue(sound_effect="punch_heavy", offset_seconds=0.5, volume=1.0)],
                    ),
                    DialogueLine(
                        line_id=2,
                        speaker_id=spk2,
                        text="You have no idea what you're up against.",
                        emotion="intense",
                        sfx=[SFXCue(sound_effect="flight_whoosh", offset_seconds=0.2, volume=0.8)],
                    ),
                ],
                visual_description=f"Cinematic {style} action sequence showcasing intense struggle and energy clash",
                environment_anchor=f"Dramatic storm-lit battle arena overlooking {topic}",
                camera_movement="dramatic_zoom",
            )
        )

    return AnimatedStoryScript(
        title=f"The Legend of {topic.title()}"[:100],
        description=f"An epic {style} showdown about {topic}. Watch until the shocking ending! #shorts #anime",
        tags=[w.lower() for w in topic.split() if len(w) > 3][:5] + [style, "animation", "shorts"],
        style=style,
        characters=chars,
        scenes=scenes,
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
