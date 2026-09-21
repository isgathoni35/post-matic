"""Unit tests for 8 Pre-Engineered Viral Niche Engines and Series Schemas."""
import pytest
from engine.script_generator import VIRAL_NICHE_CONFIGS
from engine.series_engine import create_series, build_series_context_prompt
from engine.image_generator import STYLE_MODIFIERS, NEGATIVE_PROMPTS, build_cinematic_prompt
from api.schemas import CreateSeriesRequest, SeriesResponse


def test_all_8_viral_niches_present():
    """Verify that all 8 viral niches are fully configured with hooks and tone rules."""
    expected_niches = [
        "scary_stories",
        "mythology",
        "school_gossip",
        "dark_history",
        "heists",
        "anime_lore",
        "kindness",
        "stickman",
    ]
    for niche in expected_niches:
        assert niche in VIRAL_NICHE_CONFIGS, f"Missing niche configuration: {niche}"
        cfg = VIRAL_NICHE_CONFIGS[niche]
        assert "name" in cfg
        assert "hook_formula" in cfg and len(cfg["hook_formula"]) > 20
        assert "tone_rules" in cfg and len(cfg["tone_rules"]) > 20


def test_build_series_context_prompt_injects_niche():
    """Verify that Show Bible context dynamically injects niche-specific retention guidelines."""
    bible = {
        "title": "Midnight Hauntings",
        "genre": "Horror",
        "niche": "scary_stories",
        "art_style": "cinematic_dark",
        "voice": "en-US-ChristopherNeural",
        "premise": "Unsolved eerie events reported in national parks.",
    }
    prompt = build_series_context_prompt(bible, next_episode_num=1)
    assert "=== SHOW BIBLE & CONTINUITY CONTEXT ===" in prompt
    assert "Viral Niche: Scary Stories & Creepypasta" in prompt
    assert "Niche Hook Formula" in prompt
    assert "Dread, suspense, creeping mystery" in prompt
    assert "Episode 1" in prompt


def test_sdxl_style_enforcement_anti_human_default():
    """Verify that stickman and anime styles enforce strict non-photorealistic anchors."""
    # Stickman
    stickman_style = STYLE_MODIFIERS["stickman"]
    assert "simple 2D stickman drawing" in stickman_style
    assert "non-photorealistic" in stickman_style
    assert "photorealistic" in NEGATIVE_PROMPTS["stickman"]
    assert "real humans" in NEGATIVE_PROMPTS["stickman"]

    # Anime
    anime_style = STYLE_MODIFIERS["anime"]
    assert "2D Japanese anime illustration" in anime_style
    assert "photorealistic" in NEGATIVE_PROMPTS["anime"]

    # Prompt builder output
    prompt = build_cinematic_prompt("A stickman warrior jumps across rooftops", style="stickman")
    assert "simple 2D stickman drawing" in prompt
    assert "Avoid: photorealistic" in prompt


def test_create_series_with_autopilot_fields():
    """Verify series creation preserves niche, voice, art style, and autopilot settings."""
    record = create_series(
        user_id="test-user-123",
        title="Ancient God Chronicles",
        genre="Mythology",
        tone="Epic & Majestic",
        niche="mythology",
        art_style="mythic_epic",
        voice="en-US-BrianMultilingualNeural",
        music_track="epic_orchestral",
        subtitle_style="hormozi_yellow",
        autopilot_enabled=True,
        post_frequency_per_day=2,
        preferred_time_utc="19:00",
        target_platforms=["youtube", "tiktok"],
        require_approval=False,
    )

    assert record["id"] is not None
    assert record["niche"] == "mythology"
    assert record["art_style"] == "mythic_epic"
    assert record["autopilot_enabled"] is True
    assert record["post_frequency_per_day"] == 2
    assert record["preferred_time_utc"] == "19:00"
    assert record["target_platforms"] == ["youtube", "tiktok"]
    assert record["next_post_at"] is not None

    # Bible JSON mirror
    bible = record["bible_json"]
    assert bible["niche"] == "mythology"
    assert bible["autopilot_enabled"] is True
