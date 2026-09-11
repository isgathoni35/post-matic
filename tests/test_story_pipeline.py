"""Integration test for end-to-end animated story pipeline."""
from pathlib import Path
from unittest.mock import patch
import pytest

from engine.schema import AnimatedStoryScript, Character, DialogueLine, StoryScene, SFXCue
from engine.pipeline import generate_animated_story_video, StoryGenerationResult


@pytest.fixture
def mock_animated_script():
    return AnimatedStoryScript(
        title="Swamp Awakening",
        description="Shrek and Donkey quick test",
        style="3d_cartoon",
        characters=[
            Character(
                id="shrek",
                name="Shrek",
                voice="en-US-ChristopherNeural",
                pitch="-4Hz",
                visual_dna="Green ogre in burlap vest",
                subtitle_color="#22C55E",
            ),
            Character(
                id="donkey",
                name="Donkey",
                voice="en-US-GuyNeural",
                pitch="+3Hz",
                visual_dna="Grey talking donkey",
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
                        text="Look at that.",
                        sfx=[SFXCue(sound_effect="flight_whoosh", offset_seconds=0.0)],
                    ),
                    DialogueLine(
                        line_id=2,
                        speaker_id="donkey",
                        text="I see it!",
                        sfx=[SFXCue(sound_effect="punch_heavy", offset_seconds=0.1)],
                    ),
                ],
                visual_description="Two friends looking at a relic",
                environment_anchor="Swamp at sunset",
                camera_movement="action_shake",
            )
        ],
    )


def test_generate_animated_story_pipeline_mocked(tmp_path, mock_animated_script):
    """Test full story pipeline with mocked script generation to avoid external API calls."""
    output_video = tmp_path / "test_story_output.mp4"

    with patch("engine.pipeline.generate_story_script", return_value=mock_animated_script), \
         patch("engine.pipeline.generate_story_scene_image", return_value=None):
        result = generate_animated_story_video(
            topic="Test swamp story",
            style="3d_cartoon",
            target_duration=10,
            output_path=output_video,
            cleanup_temp=False,
        )

    assert isinstance(result, StoryGenerationResult)
    assert result.video_path.exists()
    assert result.video_path.stat().st_size > 10000
    assert result.duration_seconds > 0
    assert len(result.script.characters) == 2
