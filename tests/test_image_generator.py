"""Test suite for AI Image Generator module (Imagen 3 / Nano Banana)."""
from pathlib import Path
import sys
import unittest
from unittest.mock import MagicMock, patch

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from engine.image_generator import build_cinematic_prompt, generate_ai_scene_image


class TestImageGenerator(unittest.TestCase):
    """Unit tests for prompt construction and AI image generation logic."""

    def test_build_cinematic_prompt(self):
        desc = "A terrifying colossal squid with glowing bioluminescent tentacles"
        topic = "Europa Ocean Leviathans"

        prompt = build_cinematic_prompt(desc, topic)

        self.assertIn("Europa Ocean Leviathans", prompt)
        self.assertIn(desc, prompt)
        self.assertIn("9:16", prompt)
        self.assertIn("photorealistic", prompt)
        self.assertIn("no text", prompt)

    @patch("engine.image_generator.generate_zero_opex_image", return_value=None)
    @patch("engine.image_generator.get_gemini_client")
    def test_generate_ai_scene_image_success(self, mock_get_client, mock_zero_opex):
        """Verify successful generation writes image bytes to disk when fallback to Imagen occurs."""
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client

        fake_image_bytes = b"\xFF\xD8\xFF\xE0FakeJpegBytes1234567890"
        mock_img = MagicMock()
        mock_img.image.image_bytes = fake_image_bytes

        mock_response = MagicMock()
        mock_response.generated_images = [mock_img]
        mock_client.models.generate_images.return_value = mock_response

        import tempfile
        tmp_dir = Path(tempfile.mkdtemp())

        res = generate_ai_scene_image(
            scene_id=1,
            visual_description="Bioluminescent deep sea creature",
            topic="Deep Sea Mysteries",
            output_dir=tmp_dir,
            api_key="fake_key",
        )

        self.assertIsNotNone(res)
        self.assertTrue(res.exists())
        self.assertEqual(res.read_bytes(), fake_image_bytes)

    @patch("engine.image_generator.generate_zero_opex_image", return_value=None)
    @patch("engine.image_generator.get_gemini_client")
    def test_generate_ai_scene_image_handles_failure(self, mock_get_client, mock_zero_opex):
        """Verify errors or exhausted models gracefully return None."""
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client
        mock_client.models.generate_images.side_effect = Exception("API Quota exceeded")

        import tempfile
        tmp_dir = Path(tempfile.mkdtemp())

        res = generate_ai_scene_image(
            scene_id=99,
            visual_description="Something",
            output_dir=tmp_dir,
            api_key="fake_key",
        )

        self.assertIsNone(res)

    @patch("engine.image_generator.generate_zero_opex_image")
    def test_generate_story_scene_image_prioritizes_zero_opex(self, mock_zero_opex):
        """Verify story scene image generator uses zero-opex engine first."""
        import tempfile
        from engine.image_generator import generate_story_scene_image
        tmp_dir = Path(tempfile.mkdtemp())
        def fake_generate(prompt, output_path, **kwargs):
            output_path.write_bytes(b"\xFF\xD8\xFF\xE0" + b"X" * 5000)
            return output_path

        mock_zero_opex.side_effect = fake_generate

        res = generate_story_scene_image(
            scene_id=1,
            visual_description="Red stickman kicks Blue stickman",
            environment_anchor="Dojo",
            character_dna_list=["Red: neon stick figure"],
            style="stickman",
            output_dir=tmp_dir,
        )

        self.assertIsNotNone(res)
        self.assertTrue(res.exists())
        mock_zero_opex.assert_called_once()


if __name__ == "__main__":
    unittest.main()
