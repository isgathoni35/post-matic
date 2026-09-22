import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from google import genai
from engine.config import GEMINI_API_KEY
from engine.schema import VideoScript

client = genai.Client(api_key=GEMINI_API_KEY)

model = "gemma-4-26b-a4b-it"
print(f"Testing {model} with exact schema...", flush=True)

prompt = """You are a video script writer. Generate a valid JSON object matching this exact schema:
{
  "title": "Bioluminescent Secrets",
  "description": "Discover glowing creatures in the midnight zone.",
  "tags": ["ocean", "nature", "science"],
  "scenes": [
    {
      "scene_id": 1,
      "narration": "In the darkest parts of our ocean, creatures create their own stunning neon light.",
      "visual_description": "A close up of a glowing jellyfish pulsing in pitch black water.",
      "search_keywords": ["glowing jellyfish", "deep ocean light", "bioluminescence"]
    },
    {
      "scene_id": 2,
      "narration": "Over ninety percent of deep sea life uses bioluminescence to hunt, hide, or communicate.",
      "visual_description": "An anglerfish with a glowing lure hovering in murky blue depths.",
      "search_keywords": ["anglerfish deep sea", "underwater glowing light", "ocean abyss"]
    },
    {
      "scene_id": 3,
      "narration": "It is an alien world right here on Earth, waiting to be explored.",
      "visual_description": "Wide aerial shot descending into the dark blue open ocean.",
      "search_keywords": ["dark ocean abyss", "deep sea dive underwater", "open ocean"]
    }
  ]
}
Now output a similar valid JSON object for a 15-second video about deep sea wonders. Output ONLY the raw JSON object, no commentary."""

try:
    res = client.models.generate_content(
        model=model,
        contents=prompt,
    )
    text = res.text.strip()
    if text.startswith("```json"):
        text = text[7:]
    if text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()
    parsed = VideoScript.model_validate_json(text)
    print("SUCCESSFULLY PARSED VIDEOSCRIPT!", flush=True)
    print(f"Title: {parsed.title}")
    print(f"Scenes count: {len(parsed.scenes)}")
    for s in parsed.scenes:
        print(f"  Scene {s.scene_id}: {s.narration} ({s.visual_description[:30]}...)")
except Exception as e:
    print(f"FAILED: {e}", flush=True)
