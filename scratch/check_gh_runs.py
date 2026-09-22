import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import urllib.request
import json
from engine.config import GITHUB_PAT, GITHUB_REPO

headers = {
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "PostMatic-Diagnostics",
}
if GITHUB_PAT:
    headers["Authorization"] = f"Bearer {GITHUB_PAT}"

url = f"https://api.github.com/repos/{GITHUB_REPO}/actions/runs?per_page=5"
req = urllib.request.Request(url, headers=headers, method="GET")

try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode())
        print(f"Total runs: {data.get('total_count')}")
        for r in data.get("workflow_runs", []):
            print(f"ID: {r['id']} | Event: {r['event']} | Status: {r['status']} | Conclusion: {r['conclusion']} | Title: {r['display_title']} | URL: {r['html_url']}")
except Exception as e:
    print(f"Error fetching runs: {e}")
