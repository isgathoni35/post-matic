import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from google import genai
from google.genai import types
from engine.config import GEMINI_API_KEY
from engine.schema import VideoScript

client = genai.Client(api_key=GEMINI_API_KEY)

model = "gemini-3.5-flash"
print(f"Testing {model} with response_schema=VideoScript...", flush=True)

try:
    res = client.models.generate_content(
        model=model,
        contents="Generate a 15-second script about deep ocean mystery with 3 scenes.",
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=VideoScript,
            temperature=0.7,
        ),
    )
    print("SUCCESS with gemini-3.5-flash!", flush=True)
    parsed = VideoScript.model_validate_json(res.text)
    print(f"Title: {parsed.title}", flush=True)
    print(f"Scenes count: {len(parsed.scenes)}", flush=True)
    for s in parsed.scenes:
        print(f" - {s.narration} ({s.estimated_duration}s)", flush=True)
except Exception as e:
    print(f"FAILED: {e}", flush=True)
