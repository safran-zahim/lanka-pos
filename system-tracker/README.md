# System Tracker

This folder tracks day-by-day implementation updates, errors, and verification results.

## Structure

- `CENTRAL_UPDATE_PROMPT.md`: One prompt to run after every modification.
- `MARKDOWN_REGISTRY.md`: Central list of all `.md` files in the repository.
- `daily/`: Daily log files (`YYYY-MM-DD.md`).
- `templates/`: Reusable templates for daily entries.
- `docs-updates/`: Documentation maintenance tracking linked to implementation changes.

## Daily Workflow

1. Finish your code modification.
2. Run build/tests for the changed scope.
3. Open `CENTRAL_UPDATE_PROMPT.md` and run that prompt in Copilot Chat.
4. Append updates to today's file in `daily/`.
5. If docs changed, add an entry in `docs-updates/daily-doc-updates.md`.
6. If any Markdown file changed, refresh `MARKDOWN_REGISTRY.md`.

## Naming Convention

- Daily file format: `daily/YYYY-MM-DD.md`
- Example: `daily/2026-03-25.md`

## Rules

- Log both successful and failed steps.
- Record exact errors and their status (`open`, `fixed`, `deferred`).
- Add references to touched files and commands used.
- Keep entries chronological, newest at the bottom.
- Keep ad-hoc scripts in `tools/test-queries/` and debug outputs in `tools/artifacts/`.
