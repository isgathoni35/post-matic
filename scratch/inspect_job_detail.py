import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from api.db import get_supabase_client
import json

c = get_supabase_client()
res = c.table('video_jobs').select('*').eq('id', '9d438e45-a1cf-44b3-9434-09428a8488a0').execute()
print(json.dumps(res.data, indent=2))
