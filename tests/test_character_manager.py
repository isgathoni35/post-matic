"""Unit tests for engine/character_manager.py."""
import base64
from pathlib import Path
from unittest.mock import MagicMock, patch
import pytest

from engine.character_manager import (
    save_character_image,
    extract_visual_dna_from_image,
    prepare_characters,
    CHARACTERS_DIR,
)
from engine.schema import CustomCharacterInput, Character


def test_save_character_image_base64(tmp_path):
    """Verify base64 image saving and file creation."""
    # 1x1 transparent PNG base64
    tiny_png_b64 = (
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    )
    saved_path = save_character_image(tiny_png_b64, "test_hero")
    assert saved_path is not None
    assert saved_path.exists()
    assert saved_path.suffix == ".png"
    assert saved_path.stat().st_size > 50


def test_prepare_characters_without_images():
    """Verify conversion of user custom character inputs into Character models with defaults."""
    inputs = [
        CustomCharacterInput(
            name="Kael Storm",
            voice="en-US-BrianMultilingualNeural",
            visual_notes="Cybernetic samurai with blue katana",
        ),
        CustomCharacterInput(
            name="Lyra",
            visual_notes="Silver haired rogue with twin daggers",
        ),
    ]

    characters = prepare_characters(inputs)
    assert len(characters) == 2

    c1 = characters[0]
    assert c1.id == "kael_storm"
    assert c1.name == "Kael Storm"
    assert c1.voice == "en-US-BrianMultilingualNeural"
    assert "Cybernetic samurai" in c1.visual_dna
    assert c1.subtitle_color == "#38BDF8"

    c2 = characters[1]
    assert c2.id == "lyra"
    assert c2.name == "Lyra"
    # Auto-assigned second voice
    assert c2.voice == "en-US-AvaMultilingualNeural"
    assert c2.subtitle_color == "#F59E0B"
    assert "Silver haired rogue" in c2.visual_dna


@patch("engine.character_manager.get_gemini_client")
def test_extract_visual_dna_with_mock_gemini(mock_get_client, tmp_path):
    """Verify Gemini Vision multimodal call extracts DNA descriptor."""
    # Create fake image file
    fake_img = tmp_path / "hero.png"
    fake_img.write_bytes(b"\x89PNG\r\n\x1a\n" + b"\x00" * 150)

    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = "Young warrior in ornate crimson armor with spiky dark hair and glowing eyes."
    mock_client.models.generate_content.return_value = mock_response
    mock_get_client.return_value = mock_client

    dna = extract_visual_dna_from_image(fake_img, "Kenji", visual_notes="wields a flame staff")
    assert "Kenji" in dna
    assert "crimson armor" in dna
    assert mock_client.models.generate_content.called
