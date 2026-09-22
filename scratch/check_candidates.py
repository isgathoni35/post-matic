"""Check all available models and print exact quota status."""
import os
import sys
from pathlib import Path
import time

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from engine.config import GEMINI_API_KEY
from google import genai

client = genai.Client(api_key=GEMINI_API_KEY)

candidates = [
    "gemini-flash-lite-latest",
    "gemini-3.1-flash-lite",
    "gemini-3.1-flash-lite-preview",
    "gemini-3.5-flash-lite",
    "gemma-4-26b-a4b-it",
    "gemma-4-31b-it",
    "gemini-flash-latest",
    "gemini-3.8-flash",
    "gemini-3.1-pro-preview",
]

for model in candidates:
    try:
        res = client.models.generate_content(
            model=model,
            contents="Say 'ready'",
        )
        print(f"READY: {model} -> {res.text.strip() if res.text else 'OK'}")
    except Exception as e:
        err = str(e)
        if "RESOURCE_EXHAUSTED" in err:
            print(f"EXHAUSTED: {model}")
        elif "UNAVAILABLE" in err:
            print(f"503 UNAVAILABLE: {model}")
        elif "NOT_FOUND" in err:
            print(f"NOT_FOUND: {model}")
        else:
            print(f"ERROR: {model} -> {err[:120]}")
    time.sleep(1)
