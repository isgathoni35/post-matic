import json
import time
import urllib.request
import sys

sys.stdout.reconfigure(encoding='utf-8')

USER_ID = "0e7ade15-0672-40f9-acbf-aea80fbfee50"
API_URL = "http://127.0.0.1:8000/api/video/generate"

payload = {
    "topic": "3 Mind-Blowing Facts About Deep Ocean",
    "duration": 15,
    "voice": "en-US-ChristopherNeural",
    "user_id": USER_ID,
    "publish_youtube": False,
    "privacy": "unlisted",
    "video_format": "short",
    "target_platform": "youtube",
    "mode": "shorts",
    "music_track": "epic_cinematic",
    "subtitle_style": "hormozi_yellow",
}

print(f"Submitting video generation job to {API_URL}...", flush=True)
data = json.dumps(payload).encode("utf-8")
req = urllib.request.Request(API_URL, data=data, headers={"Content-Type": "application/json"}, method="POST")

try:
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode())
        job_id = res.get("job_id") or res.get("id")
        print(f"Job created! Job ID: {job_id} | Initial status: {res.get('status')} | Progress: {res.get('progress_pct')}%", flush=True)
except Exception as e:
    print(f"Failed to submit job: {e}", flush=True)
    sys.exit(1)

status_url = f"http://127.0.0.1:8000/api/video/status/{job_id}"
print(f"Monitoring progress at {status_url}...", flush=True)

last_status = None
last_pct = None

for i in range(120): # up to 10 minutes
    try:
        req_status = urllib.request.Request(status_url, method="GET")
        with urllib.request.urlopen(req_status) as resp:
            data = json.loads(resp.read().decode())
            status = data.get("status")
            pct = data.get("progress_pct")
            video_url = data.get("video_url")
            youtube_url = data.get("youtube_url")
            err = data.get("error_message")

            if status != last_status or pct != last_pct:
                print(f"[{time.strftime('%X')}] Status: {status} | Progress: {pct}%", flush=True)
                if err:
                    print(f"  Error details: {err}", flush=True)
                if video_url:
                    print(f"  Video URL: {video_url}", flush=True)
                if youtube_url:
                    print(f"  YouTube URL: {youtube_url}", flush=True)
                last_status = status
                last_pct = pct

            if status in ("completed", "failed"):
                print(f"\nFinal State reached: {status.upper()}!", flush=True)
                if youtube_url:
                    print(f"SUCCESS: Video published to YouTube at: {youtube_url}")
                if video_url:
                    print(f"SUCCESS: Video available at: {video_url}")
                if err:
                    print(f"FAILED with error: {err}")
                break
    except Exception as e:
        print(f"Error checking status: {e}", flush=True)
    time.sleep(5)
