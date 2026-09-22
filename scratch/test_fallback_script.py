import sys
from pathlib import Path
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from engine.schema import VideoScript, Scene

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

    # Adjust for requested scene count
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

script = _build_fallback_video_script("James Webb Space Telescope Deep Ocean Wonders", target_duration=25, num_scenes=3)
print("Fallback VideoScript Validated Successfully!")
print(f"Title: {script.title}")
print(f"Scenes: {len(script.scenes)}")
for s in script.scenes:
    print(f"Scene {s.scene_id}: {s.narration}")
    print(f"   Keywords: {s.search_keywords}")
