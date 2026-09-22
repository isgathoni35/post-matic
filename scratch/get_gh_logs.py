import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import urllib.request
import json
from engine.config import GITHUB_PAT, GITHUB_REPO

run_id = 35753074931
url = f"https://api.github.com/repos/{GITHUB_REPO}/actions/runs/{run_id}/jobs"
headers = {
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "PostMatic-Diagnostics",
}
if GITHUB_PAT:
    headers["Authorization"] = f"Bearer {GITHUB_PAT}"

req = urllib.request.Request(url, headers=headers, method="GET")

with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())
    job_id = data["jobs"][0]["id"]

log_url = f"https://api.github.com/repos/{GITHUB_REPO}/actions/jobs/{job_id}/logs"

class NoAuthRedirectHandler(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        m = req.get_method()
        new_req = urllib.request.Request(
            newurl,
            headers={k: v for k, v in req.headers.items() if k.lower() != 'authorization'},
            method=m
        )
        return new_req

opener = urllib.request.build_opener(NoAuthRedirectHandler)
req_log = urllib.request.Request(log_url, headers=headers, method="GET")

try:
    with opener.open(req_log) as resp:
        log_text = resp.read().decode("utf-8", errors="replace")
        lines = log_text.splitlines()
        print(f"Total log lines: {len(lines)}")
        # Print lines around the failure
        for l in lines[-80:]:
            print(l)
except Exception as e:
    print(f"Error fetching logs: {e}")
