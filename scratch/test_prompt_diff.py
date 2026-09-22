import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from google import genai
from google.genai import types
from engine.config import GEMINI_API_KEY
from engine.schema import VideoScript
from engine.script_generator import SYSTEM_INSTRUCTION

client = genai.Client(api_key=GEMINI_API_KEY)

topic = "3 unbelievable facts about deep sea creatures"
target_duration = 15
num_scenes = 3

prompt_concise = f"""Generate a captivating {target_duration}-second short-form video script about: {topic}.
Include exactly {num_scenes} scenes. Each scene needs compelling narration and 2-4 concrete Pexels search keywords."""

print("Testing prompt_concise with gemini-3-flash-preview...")
try:
    res = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=prompt_concise,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=VideoScript,
            temperature=0.7,
        ),
    )
    print("SUCCESS with prompt_concise!")
    print(res.text[:250])
except Exception as e:
    print(f"FAILED with prompt_concise: {e}")
