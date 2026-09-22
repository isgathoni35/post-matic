import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from google import genai
from google.genai import types
from engine.config import GEMINI_API_KEY
from engine.schema import VideoScript

client = genai.Client(api_key=GEMINI_API_KEY)

model = "gemini-3-flash-preview"
print(f"Testing model {model} with response_schema=VideoScript...")

try:
    res = client.models.generate_content(
        model=model,
        contents="Generate a 15-second script about Mars exploration with 3 scenes.",
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=VideoScript,
            temperature=0.7,
        ),
    )
    print("SUCCESS with schema!")
    print(res.text[:300])
except Exception as e:
    print(f"FAILED with schema: {e}")

print("Testing model with prompt JSON instruction instead of response_schema...")
try:
    res = client.models.generate_content(
        model=model,
        contents="Generate a 15-second script about Mars exploration with 3 scenes in JSON matching schema: {title: str, description: str, tags: list[str], scenes: list[{scene_number: int, narration: str, estimated_duration: float, search_keywords: list[str]}]}",
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.7,
        ),
    )
    print("SUCCESS without response_schema!")
    print(res.text[:300])
except Exception as e:
    print(f"FAILED without schema: {e}")
