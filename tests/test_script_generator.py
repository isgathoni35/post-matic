"""Tests for the LLM Scripting module."""
import pytest
from engine.schema import VideoScript, Scene
from engine.script_generator import generate_script


def test_generate_script_schema():
    """Verify that generate_script produces a valid VideoScript conforming to Pydantic schema."""
    topic = "The deep sea creatures of the midnight zone"
    script = generate_script(topic=topic, target_duration=15, target_scenes=3)

    assert isinstance(script, VideoScript)
    assert len(script.title) > 0
    assert len(script.description) > 0
    assert len(script.scenes) >= 3

    for scene in script.scenes:
        assert isinstance(scene, Scene)
        assert scene.scene_id > 0
        assert len(scene.narration.strip()) > 0
        assert len(scene.visual_description.strip()) > 0
        assert len(scene.search_keywords) >= 1
        assert all(isinstance(k, str) and len(k) > 0 for k in scene.search_keywords)


if __name__ == "__main__":
    test_generate_script_schema()
    print("All test assertions passed successfully!")
