import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from google import genai
from google.genai import types
from engine.config import GEMINI_API_KEY
from engine.schema import VideoScript
from engine.script_generator import SYSTEM_INSTRUCTION

client = genai.Client(api_key=GEMINI_API_KEY)

print("1. Testing with system_instruction:", flush=True)
try:
    res = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents="Generate a 15-second script about Mars exploration with 3 scenes.",
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=VideoScript,
            system_instruction=SYSTEM_INSTRUCTION,
            temperature=0.7,
        ),
    )
    print("SUCCESS with system_instruction!", flush=True)
except Exception as e:
    print(f"FAILED with system_instruction: {e}", flush=True)

print("2. Testing WITHOUT system_instruction (appended to prompt):", flush=True)
try:
    res = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=f"{SYSTEM_INSTRUCTION}\n\nGenerate a 15-second script about Mars exploration with 3 scenes.",
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=VideoScript,
            temperature=0.7,
        ),
    )
    print("SUCCESS without system_instruction!", flush=True)
except Exception as e:
    print(f"FAILED without system_instruction: {e}", flush=True)
