import sys
from pathlib import Path
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from google import genai
from engine.config import GEMINI_API_KEY
from engine.schema import VideoScript
from engine.script_generator import _clean_json_str

client = genai.Client(api_key=GEMINI_API_KEY)

model = "gemini-flash-lite-latest"
print(f"Testing {model} with clean prompt...", flush=True)

prompt = """You are a video scriptwriter. Topic: '3 mind-blowing space facts'.
Return ONLY a valid JSON object matching this schema:
{
  "title": "Short title",
  "description": "Short description",
  "tags": ["space", "universe"],
  "scenes": [
    {
      "scene_id": 1,
      "narration": "First scene narration",
      "visual_description": "Visual scene description",
      "search_keywords": ["keyword 1", "keyword 2"]
    }
  ]
}"""

try:
    res = client.models.generate_content(
        model=model,
        contents=prompt,
    )
    cleaned = _clean_json_str(res.text or "")
    print(f"RAW: {cleaned[:100]}", flush=True)
    parsed = VideoScript.model_validate_json(cleaned)
    print("SUCCESS! Title:", repr(parsed.title), flush=True)
except Exception as e:
    print(f"FAILED: {e}", flush=True)
