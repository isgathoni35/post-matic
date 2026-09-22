import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import urllib.request
import json
from engine.config import GITHUB_PAT, GITHUB_REPO

run_id = 35753789549
url = f"https://api.github.com/repos/{GITHUB_REPO}/actions/runs/{run_id}/jobs"
headers = {
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "PostMatic-Diagnostics",
}
if GITHUB_PAT:
    headers["Authorization"] = f"Bearer {GITHUB_PAT}"

req = urllib.request.Request(url, headers=headers, method="GET")

try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode())
        for job in data.get("jobs", []):
            print(f"Job: {job['name']} | Conclusion: {job['conclusion']}")
            for step in job.get("steps", []):
                print(f"  Step: {step['name']} | Conclusion: {step['conclusion']}")
except Exception as e:
    print(f"Error fetching jobs: {e}")
