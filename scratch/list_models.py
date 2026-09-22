"""List all available Gemini models for the current API key."""
import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from engine.config import GEMINI_API_KEY
from google import genai

client = genai.Client(api_key=GEMINI_API_KEY)

try:
    print("Listing models...")
    for model in client.models.list():
        # Only show models that support generateContent
        supported = getattr(model, "supported_generation_methods", []) or getattr(model, "supported_actions", [])
        name = getattr(model, "name", str(model))
        display_name = getattr(model, "display_name", "")
        print(f"Name: {name} | Display: {display_name} | Methods: {supported}")
except Exception as e:
    print(f"Error listing models: {e}")
