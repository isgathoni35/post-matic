import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from google import genai
from engine.config import GEMINI_API_KEY

client = genai.Client(api_key=GEMINI_API_KEY)
candidates = [
    "gemini-flash-latest",
    "gemini-flash-lite-latest",
    "gemini-2.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash-lite",
    "gemini-3-flash-preview",
    "gemini-3.8-flash",
    "gemini-pro-latest",
]

for c in candidates:
    try:
        res = client.models.generate_content(model=c, contents="Hello, reply with OK")
        print(f"SUCCESS with model: {c} -> text: {res.text.strip()[:30]}")
    except Exception as e:
        print(f"FAILED with model: {c} -> {str(e)[:120]}")
