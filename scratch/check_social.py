import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from api.db import get_social_accounts

USER_ID = "0e7ade15-0672-40f9-acbf-aea80fbfee50"
accounts = get_social_accounts(USER_ID)
print(f"Social accounts found for user {USER_ID}: {len(accounts)}")
for a in accounts:
    print(f"ID: {a.get('id')} | Platform: {a.get('platform')} | Name: {a.get('account_name')} | Updated: {a.get('updated_at')}")
