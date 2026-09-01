# Master Development Directives: Faceless Video SaaS

This project follows strict development rules and architectural constraints defined in `faceless-blueprint.md` and `.agents/rules/`.

## Core Directives Summary
1. **One Task at a Time:** Execute strictly one step from the Progress Tracker at a time. No jumping ahead. Each step must be implemented, tested, and confirmed working by the user before moving to the next.
2. **Iterative Quality Loops:** If any test, script, or component fails, diagnose stack traces and resolve immediately.
3. **Strict Credential Protocol:** Never guess, mock, or bypass API credentials. Halt execution, explain key generation steps to the user, and wait for `.env` configuration.
4. **Zero-OpEx MVP:** Adhere to free-tier architectures (FastAPI, Supabase, Next.js on Vercel, edge-tts, FFmpeg + GitHub Actions compute).

Refer to modular rules:
- [.agents/rules/ai-workflow-directives.md](file:///home/elias_g/Projects/post-matic/.agents/rules/ai-workflow-directives.md)
- [.agents/rules/credential-handling.md](file:///home/elias_g/Projects/post-matic/.agents/rules/credential-handling.md)
- [.agents/rules/architecture-and-stack.md](file:///home/elias_g/Projects/post-matic/.agents/rules/architecture-and-stack.md)
- [PROGRESS_TRACKER.md](file:///home/elias_g/Projects/post-matic/PROGRESS_TRACKER.md)
