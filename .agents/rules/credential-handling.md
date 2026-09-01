# Credential Handling Protocol

## Strict Zero-Guessing Policy
- **No Mocking or Bypassing:** You will **never** attempt to mock, bypass, placeholder, or guess API keys, OAuth client IDs/secrets, or database URIs in production code paths.
- **Halting Protocol:** When a task requires a secret (e.g., Supabase URL, Supabase Anon/Service Key, Gemini API Key, Pexels API Key, YouTube OAuth Credentials, TikTok API Credentials):
  1. **Halt execution** immediately.
  2. **Provide clear, step-by-step instructions** to the user on where and how to obtain the necessary credentials (e.g., direct URLs to developer consoles, exact scopes/permissions required).
  3. **Provide template environment variables** (`.env.example`).
  4. **Wait for the user** to provide the credentials securely via `.env` before attempting to run live API calls or tests.
- **Security:** Never print raw API keys, tokens, or passwords to logs or console outputs.
