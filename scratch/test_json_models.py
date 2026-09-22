import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from google import genai
from google.genai import types
from engine.config import GEMINI_API_KEY
from engine.schema import VideoScript

client = genai.Client(api_key=GEMINI_API_KEY)

test_list = [
    "gemini-3-flash-preview",
    "gemini-flash-lite-latest",
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash-lite",
    "gemini-flash-latest",
]

for m in test_list:
    try:
        res = client.models.generate_content(
            model=m,
            contents="Say hi in JSON: {greeting: str}",
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            )
        )
        print(f"SUCCESS: {m} -> {res.text.strip()[:40]}", flush=True)
    except Exception as e:
        print(f"FAIL: {m} -> {str(e)[:80]}", flush=True)
