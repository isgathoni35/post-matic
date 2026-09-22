import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from google import genai
from engine.config import GEMINI_API_KEY

client = genai.Client(api_key=GEMINI_API_KEY)

all_models = [
    "gemini-3.1-flash-lite-preview",
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-flash-latest",
    "gemini-3-flash-preview",
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-2.5-pro",
    "gemini-3.1-pro-preview",
    "gemma-4-26b-a4b-it",
    "gemma-4-31b-it",
]

for m in all_models:
    try:
        res = client.models.generate_content(
            model=m,
            contents="Say 'hello'",
        )
        print(f"AVAILABLE: {m} -> {res.text.strip()[:30]}", flush=True)
    except Exception as e:
        msg = str(e)
        if "503" in msg or "UNAVAILABLE" in msg:
            print(f"503 UNAVAILABLE: {m}", flush=True)
        elif "429" in msg or "RESOURCE_EXHAUSTED" in msg:
            print(f"429 EXHAUSTED: {m}", flush=True)
        elif "404" in msg:
            print(f"404 NOT FOUND: {m}", flush=True)
        else:
            print(f"OTHER: {m} -> {msg[:60]}", flush=True)
