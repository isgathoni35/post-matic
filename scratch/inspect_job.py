import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from api.db import get_supabase_client
import json

c = get_supabase_client()
res = c.table('video_jobs').select('*').order('created_at', desc=True).limit(5).execute()
for j in res.data:
    print('-----------------------------------------')
    print('ID:', j.get('id'))
    print('Topic:', j.get('topic'))
    print('Status:', j.get('status'), '| Progress:', j.get('progress_pct'))
    print('Error:', j.get('error_message'))
    print('Video URL:', j.get('video_url'))
    print('Created:', j.get('created_at'), '| Updated:', j.get('updated_at'))
    sd = j.get('script_data') or {}
    print('Scenes count:', len(sd.get('scenes', [])))
