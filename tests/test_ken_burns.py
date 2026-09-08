"""Test suite for Ken Burns image-to-video motion generator."""
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import imageio_ffmpeg
from engine.video_renderer import image_to_ken_burns_clip, process_scene_clip
from engine.tts_engine import get_audio_duration


class TestKenBurnsMotion(unittest.TestCase):
    """Verify conversion of 9:16 images into fluid MP4 video clips via FFmpeg."""

    @classmethod
    def setUpClass(cls):
        cls.temp_dir = Path(tempfile.mkdtemp())
        cls.ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()

        # Generate a test 1080x1920 solid color image
        cls.test_image = cls.temp_dir / "test_portrait.jpg"
        cmd = [
            cls.ffmpeg,
            "-y",
            "-f", "lavfi",
            "-i", "color=c=0x1a2b3c:s=1080x1920",
            "-vframes", "1",
            str(cls.test_image),
        ]
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    def test_image_to_ken_burns_clip(self):
        """Test image_to_ken_burns_clip produces an exact duration 1080x1920 MP4."""
        out_clip = self.temp_dir / "ken_burns_output.mp4"
        target_dur = 3.5

        image_to_ken_burns_clip(
            image_path=self.test_image,
            target_duration=target_dur,
            output_path=out_clip,
            target_fps=30,
        )

        self.assertTrue(out_clip.exists())
        self.assertGreater(out_clip.stat().st_size, 1000)

        # Probe duration
        dur = get_audio_duration(out_clip)
        self.assertAlmostEqual(dur, target_dur, delta=0.2)

    def test_process_scene_clip_detects_image(self):
        """Verify process_scene_clip routes image assets to Ken Burns seamlessly."""
        out_clip = self.temp_dir / "scene_from_image.mp4"
        target_dur = 2.0

        res = process_scene_clip(
            video_path=self.test_image,
            target_duration=target_dur,
            output_path=out_clip,
        )

        self.assertEqual(res, out_clip)
        self.assertTrue(out_clip.exists())
        dur = get_audio_duration(out_clip)
        self.assertAlmostEqual(dur, target_dur, delta=0.2)


if __name__ == "__main__":
    unittest.main()
