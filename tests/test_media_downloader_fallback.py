"""Test suite for Media Downloader smart fallback hierarchy."""
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import MagicMock, patch

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from engine.media_downloader import fetch_scene_media, expand_search_queries


class TestMediaDownloaderFallback(unittest.TestCase):
    """Verify fallback from Pexels -> Imagen 3 -> Topic Stock."""

    def test_expand_search_queries(self):
        long_kw = ["deep sea bioluminescent giant squid tentacles"]
        expanded = expand_search_queries(long_kw)

        self.assertIn("deep sea bioluminescent giant squid tentacles", expanded)
        self.assertIn("deep sea", expanded)
        self.assertIn("squid tentacles", expanded)

    @patch("engine.media_downloader.search_pexels_video")
    @patch("engine.media_downloader.generate_ai_scene_image")
    def test_fetch_scene_media_triggers_ai_fallback(self, mock_gen_image, mock_search_pexels):
        """When Pexels returns 0 results, AI generation is triggered."""
        mock_search_pexels.return_value = None  # Pexels found nothing

        tmp_dir = Path(tempfile.mkdtemp())
        fake_ai_img = tmp_dir / "scene_1_ai_visual.jpg"
        fake_ai_img.write_bytes(b"FakeImageData")
        mock_gen_image.return_value = fake_ai_img

        result = fetch_scene_media(
            scene_id=1,
            keywords=["deep sea alien creature"],
            visual_description="A terrifying alien creature with glowing eyes",
            topic="Deep Sea Aliens",
            output_dir=tmp_dir,
            enable_ai_fallback=True,
        )

        mock_gen_image.assert_called_once()
        self.assertTrue(result.is_ai_generated)
        self.assertEqual(result.source, "imagen")
        self.assertEqual(result.file_path, fake_ai_img)


if __name__ == "__main__":
    unittest.main()
