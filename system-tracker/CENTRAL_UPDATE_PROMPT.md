# Central Update Prompt (Run After Every Modification)

Copy this prompt into Copilot Chat after each code modification:

---

You are updating this repository's system tracker.

Task:
1. Review all changes made since the last tracker update.
2. Identify what was implemented, what was fixed, and what still fails.
3. Capture exact build/test verification status.
4. Append a new time-stamped entry to today's log file in `system-tracker/daily/YYYY-MM-DD.md`.
5. If today's file does not exist, create it from `system-tracker/templates/daily-template.md`.
6. If documentation changed, append an item to `system-tracker/docs-updates/daily-doc-updates.md`.
7. Ensure any new ad-hoc test/query script is placed under `tools/test-queries/` (not repository root).
8. Ensure generated debug outputs are stored under `tools/artifacts/`.
9. If any `.md` file changed, update `system-tracker/MARKDOWN_REGISTRY.md`.

Required output format for the entry:
- Time:
- Summary:
- Implemented:
- Files touched:
- Errors found:
- Errors fixed:
- Pending issues:
- Verification run:
- Result:
- Next action:
- Docs updated:

Rules:
- Do not overwrite previous entries.
- Keep facts concise and concrete.
- Include command names used for verification.
- Mention branch name and commit hash if available.
- Keep test/query utilities centralized in `tools/test-queries/`.
- Do not place temporary logs/json/txt at repository root.
- Keep `system-tracker/MARKDOWN_REGISTRY.md` aligned with actual `.md` files.

---

Optional command context to include in your update:
- `git status --short`
- `git diff --name-only`
- `npm run build` or `npm run build:all`
- test command output for changed scope
- `npx ts-node tools/test-queries/...` output when relevant
- `Get-ChildItem -Recurse -File -Filter *.md`
