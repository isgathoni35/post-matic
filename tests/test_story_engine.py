"""Unit tests for PostMatic AI Animation & Multi-Character Story Engine."""
from pathlib import Path
import pytest

from engine.schema import (
    AnimatedStoryScript,
    Character,
    DialogueLine,
    SFXCue,
    StoryScene,
    VideoScript,
    Scene,
)
from engine.tts_engine import (
    hex_to_ass_color,
    WordTiming,
    synthesize_story_dialogue,
    StoryTTSResult,
)


def test_story_schema_validation():
    """Verify AnimatedStoryScript correctly validates multi-character screenplay payload."""
    script = AnimatedStoryScript(
        title="Swamp Cyberpunk Clash",
        description="Shrek and Donkey encounter a high-tech glowing artifact",
        tags=["shrek", "donkey", "animation", "humor"],
        style="3d_cartoon",
        characters=[
            Character(
                id="shrek",
                name="Shrek",
                voice="en-US-ChristopherNeural",
                pitch="-4Hz",
                rate="-2%",
                visual_dna="Large friendly green ogre wearing rustic burlap tunic and brown vest",
                subtitle_color="#22C55E",
            ),
            Character(
                id="donkey",
                name="Donkey",
                voice="en-US-GuyNeural",
                pitch="+3Hz",
                rate="+8%",
                visual_dna="Small energetic grey talking donkey with large expressive eyes",
                subtitle_color="#F59E0B",
            ),
        ],
        scenes=[
            StoryScene(
                scene_id=1,
                dialogue=[
                    DialogueLine(
                        line_id=1,
                        speaker_id="shrek",
                        text="Donkey, what in the swamp is that glowing thing?",
                        emotion="suspicious",
                        sfx=[SFXCue(sound_effect="glass_clink", offset_seconds=0.5)],
                    ),
                    DialogueLine(
                        line_id=2,
                        speaker_id="donkey",
                        text="I don't know Shrek, but it's shiny and I want to touch it!",
                        emotion="excited",
                        sfx=[SFXCue(sound_effect="flight_whoosh", offset_seconds=0.2)],
                    ),
                ],
                visual_description="Shrek looking down at a neon cyber relic in the murky mud",
                environment_anchor="Murky swamp clearing under twilight with glowing moss",
                camera_movement="slow_push_in",
            )
        ],
    )

    assert script.title == "Swamp Cyberpunk Clash"
    assert len(script.characters) == 2
    assert script.characters[0].name == "Shrek"
    assert script.scenes[0].dialogue[0].speaker_id == "shrek"
    assert script.scenes[0].dialogue[1].sfx[0].sound_effect == "flight_whoosh"


def test_hex_to_ass_color():
    """Verify RGB hex colors correctly convert to ASS &H00BBGGRR format."""
    # White
    assert hex_to_ass_color("#FFFFFF") == "&H00FFFFFF"
    assert hex_to_ass_color("FFFFFF") == "&H00FFFFFF"

    # Green #22C55E -> R=22, G=C5, B=5E -> ASS is BGR: 5EC522
    assert hex_to_ass_color("#22C55E") == "&H005EC522"

    # Amber #F59E0B -> R=F5, G=9E, B=0B -> ASS is BGR: 0B9EF5
    assert hex_to_ass_color("#F59E0B") == "&H000B9EF5"

    # Cyan #38BDF8 -> R=38, G=BD, B=F8 -> ASS is BGR: F8BD38
    assert hex_to_ass_color("#38BDF8") == "&H00F8BD38"


def test_backward_compatibility_word_timing():
    """Verify WordTiming retains 100% backward compatibility for existing callers."""
    w = WordTiming(text="volcano", start=0.5, end=1.2)
    assert w.text == "volcano"
    assert w.speaker_id == "narrator"
    assert w.color_hex == "#FFFFFF"
    assert round(w.duration, 2) == 0.7


def test_synthesize_story_dialogue_mock(tmp_path):
    """Verify synthesize_story_dialogue runs end-to-end and produces audio + subtitles."""
    test_story = AnimatedStoryScript(
        title="Quick Duel",
        description="Anime rivals exchange words",
        style="anime",
        characters=[
            Character(
                id="hero",
                name="Kenji",
                voice="en-US-BrianMultilingualNeural",
                pitch="-1Hz",
                visual_dna="Silver haired anime swordsman",
                subtitle_color="#38BDF8",
            ),
            Character(
                id="rival",
                name="Ren",
                voice="en-US-GuyNeural",
                pitch="+1Hz",
                visual_dna="Dark cloaked cyber ninja",
                subtitle_color="#F43F5E",
            ),
        ],
        scenes=[
            StoryScene(
                scene_id=1,
                dialogue=[
                    DialogueLine(
                        line_id=1,
                        speaker_id="hero",
                        text="You won't pass.",
                        sfx=[SFXCue(sound_effect="sword_clash", offset_seconds=0.1)],
                    ),
                    DialogueLine(
                        line_id=2,
                        speaker_id="rival",
                        text="Watch me.",
                        sfx=[SFXCue(sound_effect="punch_heavy", offset_seconds=0.0)],
                    ),
                ],
                visual_description="Two warriors facing off in rain",
                environment_anchor="Rainy Tokyo rooftop",
            )
        ],
    )

    result = synthesize_story_dialogue(test_story, output_dir=tmp_path)
    assert isinstance(result, StoryTTSResult)
    assert result.audio_path.exists()
    assert result.subtitle_path.exists()
    assert result.total_duration > 0
    assert len(result.sfx_cues) == 2
    assert result.sfx_cues[0].sound_effect == "sword_clash"
    assert result.sfx_cues[1].sound_effect == "punch_heavy"

    sub_content = result.subtitle_path.read_text(encoding="utf-8")
    assert "Dialogue:" in sub_content
    # Check that character colors were injected into ASS subtitle styling
    assert "\\c" in sub_content


def test_reconcile_custom_characters():
    """Verify user-defined custom characters override or merge into story screenplay cast."""
    from engine.script_generator import _reconcile_characters

    custom_cast = [
        Character(
            id="kael",
            name="Kael",
            voice="en-US-BrianMultilingualNeural",
            visual_dna="Cybernetic samurai with blue katana",
            subtitle_color="#38BDF8",
        ),
        Character(
            id="lyra",
            name="Lyra",
            voice="en-US-AvaMultilingualNeural",
            visual_dna="Silver haired rogue with twin daggers",
            subtitle_color="#F59E0B",
        ),
    ]

    # Suppose LLM generated a story with slightly different id or generic char
    story = AnimatedStoryScript(
        title="Rooftop Infiltration",
        description="Two rogues infiltrate a neon fortress",
        tags=["action", "cyber"],
        style="anime",
        characters=[
            Character(
                id="kael",
                name="Kael",
                voice="en-US-GuyNeural",
                visual_dna="A man",
                subtitle_color="#FFFFFF",
            ),
            Character(
                id="guard",
                name="Fortress Guard",
                voice="en-US-ChristopherNeural",
                visual_dna="Heavy cyber guard with shield",
                subtitle_color="#EF4444",
            ),
        ],
        scenes=[
            StoryScene(
                scene_id=1,
                dialogue=[
                    DialogueLine(
                        line_id=1,
                        speaker_id="kael",
                        text="The shields are active.",
                    )
                ],
                visual_description="Kael examining the laser barrier",
                environment_anchor="Cyber rooftop at night",
            )
        ],
    )

    reconciled = _reconcile_characters(story, custom_cast)
    # Custom characters should be preserved with user-defined voice and visual DNA
    char_map = {c.id: c for c in reconciled.characters}
    assert "kael" in char_map
    assert "lyra" in char_map
    assert "guard" in char_map
    assert char_map["kael"].voice == "en-US-BrianMultilingualNeural"
    assert "Cybernetic samurai" in char_map["kael"].visual_dna
    assert char_map["kael"].subtitle_color == "#38BDF8"
    assert char_map["lyra"].voice == "en-US-AvaMultilingualNeural"
