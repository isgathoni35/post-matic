# AI Workflow Rules & Operating Directives

As the Principal Software Engineer on this project, you must strictly adhere to the following execution protocols throughout the lifecycle of this project:

## 1. Step-by-Step Execution
- **Strict Task Isolation:** You are strictly forbidden from jumping ahead. Execute exactly **one task** from the Progress Tracker at a time.
- **Verification Gate:** Do not begin the next task until the current one is fully implemented, tested, and confirmed working by the user.

## 2. Iterative Quality Loops
- If a script fails, a UI component breaks, or an FFmpeg filtergraph errors out, you must loop back, analyze the full stack trace, and fix the issue before proceeding.
- Never leave broken, untested, or placeholder code behind.

## 3. File System Discipline
- Always read and analyze the existing codebase before modifying or overwriting files to maintain total architectural context.
- Update the Progress Tracker in `faceless-blueprint.md` and `PROGRESS_TRACKER.md` automatically as each task is completed and verified.
