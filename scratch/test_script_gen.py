"""Verify generate_script works out-of-the-box with default configuration."""
import os
import sys
from pathlib import Path

# Force UTF-8 on Windows stdout
sys.stdout.reconfigure(encoding='utf-8')

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from engine.script_generator import generate_script

try:
    print("Testing generate_script() with default model hierarchy...", flush=True)
    script = generate_script(
        topic="3 unbelievable facts about deep sea creatures",
        target_duration=15,
        target_scenes=3
    )
    print("SUCCESS!", flush=True)
    print(f"Title: {repr(script.title)}", flush=True)
    print(f"Scenes count: {len(script.scenes)}", flush=True)
    for i, s in enumerate(script.scenes):
        print(f"  Scene {i+1}: {repr(s.narration)} [keywords: {s.search_keywords}]", flush=True)
except Exception as e:
    print(f"FAILED with error: {repr(e)}", flush=True)
