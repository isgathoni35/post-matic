import sys
import time
from pathlib import Path
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from google import genai
from engine.config import GEMINI_API_KEY
from engine.schema import VideoScript
from engine.script_generator import _clean_json_str

client = genai.Client(api_key=GEMINI_API_KEY)

model = "gemma-4-26b-a4b-it"
topic = "3 unbelievable facts about deep sea creatures"
target_duration = 15
num_scenes = 3

prompt = f"""You are a viral video scriptwriter. Topic: '{topic}'.
Create a captivating {target_duration}-second script with exactly {num_scenes} scenes.
Return ONLY a valid JSON object in this exact schema without any markdown formatting or commentary:
{{
  "title": "Short catchy title",
  "description": "Engaging description with hashtags",
  "tags": ["tag1", "tag2", "tag3"],
  "scenes": [
    {{
      "scene_id": 1,
      "narration": "Natural spoken conversational narration with contractions.",
      "visual_description": "Clear cinematic visual description.",
      "search_keywords": ["keyword 1", "keyword 2"]
    }}
  ]
}}"""

start = time.time()
print("Starting fast Gemma request...", flush=True)
res = client.models.generate_content(
    model=model,
    contents=prompt,
)
elapsed = time.time() - start
print(f"Gemma finished in {elapsed:.1f}s!", flush=True)

cleaned = _clean_json_str(res.text or "")
parsed = VideoScript.model_validate_json(cleaned)
print(f"SUCCESS! Parsed title: {repr(parsed.title)}", flush=True)
print(f"Scenes count: {len(parsed.scenes)}", flush=True)
for s in parsed.scenes:
    print(f" - Scene {s.scene_id}: {repr(s.narration)}", flush=True)
