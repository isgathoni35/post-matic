import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from google import genai
from engine.config import GEMINI_API_KEY

client = genai.Client(api_key=GEMINI_API_KEY)

for m in client.models.list():
    name = m.name.replace("models/", "")
    # skip embedding or tts or live
    if any(k in name for k in ["embed", "tts", "live", "bidi", "transcribe", "veo", "robotics"]):
        continue
    try:
        res = client.models.generate_content(
            model=name,
            contents="Say 'OK'",
        )
        print(f"SUCCESS: {name} -> {res.text.strip()[:20]}", flush=True)
    except Exception as e:
        msg = str(e)
        if "RESOURCE_EXHAUSTED" in msg:
            print(f"EXHAUSTED: {name}", flush=True)
        elif "UNAVAILABLE" in msg:
            print(f"UNAVAILABLE: {name}", flush=True)
        elif "NOT_FOUND" in msg:
            print(f"NOT_FOUND: {name}", flush=True)
        else:
            print(f"ERR: {name} -> {msg[:60]}", flush=True)
