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
10. Keep all project docs centralized under `docs/` (except tracker docs under `system-tracker/`).
11. If user-visible behavior changed, mark **"User-visible behavior: Yes"** in daily log entry (used by sync script).
12. When updating `system-tracker/MARKDOWN_REGISTRY.md`, also refresh its `Last updated:` date.
13. If routes/controllers/models/pages/stores/flows changed, update `system-tracker/knowledge-base/LANKA_POS_WORKSPACE_ARCHITECTURE_ANALYSIS.md`.
14. Include a database verification snapshot in the knowledge base when DB checks pass.

## Post-Feature Completion Workflow

After completing a feature, bug fix, refactoring, or other significant change, follow this workflow:

1. **Update Daily Log** (Required - enforced by pre-commit hook)
   - Ensure today's entry exists: `system-tracker/daily/YYYY-MM-DD.md`
   - Use template: `system-tracker/templates/daily-template.md`
   - Mark "User-visible behavior: Yes/No" for changelog extraction
   - Include comprehensive details: implemented items, errors, testing status, architecture impact

2. **Follow Completion Checklist** (Recommended)
   - Use: `system-tracker/templates/COMPLETION_CHECKLIST.md`
   - Verify build passes, tests pass, no regressions
   - Ensure documentation updated (API docs, architecture notes, etc.)
   - Confirm no sensitive data in code, no debugging code left behind

3. **Commit Code** (Pre-commit hook validates changelog entry)
   - Daily log update will be required before commit succeeds
   - If needed, override with `git commit --no-verify` (emergency only)

4. **Sync Root CHANGELOG** (After merging to main, optional)
   - Preview changes: `npm run changelog:check`
   - Run sync: `npm run changelog:sync`
   - Review output: `git diff CHANGELOG.md`
   - Commit separately: `git commit -m "docs: update changelog"`

5. **Check Status Anytime** (Optional monitoring)
   - `npm run changelog:status` — shows today's update status and recent files

**Key Field for CHANGELOG Sync**: `User-visible behavior: Yes/No`
- Mark "Yes" for features, bug fixes, UI improvements, breaking changes
- Mark "No" for internal refactoring, infrastructure, test improvements
- See `system-tracker/docs-updates/CHANGELOG_MAINTENANCE_GUIDE.md` for detailed guidance

**Helpful Commands**:
- `npm run changelog:check` — Preview what would be synced to CHANGELOG.md
- `npm run changelog:sync` — Interactive sync (preview → confirm → apply)
- `npm run changelog:status` — Check today's status and recent updates
- Create today's log: `cp system-tracker/templates/daily-template.md system-tracker/daily/$(date +%Y-%m-%d).md`

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
- Keep `CHANGELOG.md` aligned with implemented feature/fix changes.
- Keep architecture and request-flow mapping up to date in `system-tracker/knowledge-base/`.

---

Optional command context to include in your update:
- `git status --short`
- `git diff --name-only`
- `npm run build` or `npm run build:all`
- test command output for changed scope
- `npx ts-node tools/test-queries/...` output when relevant
- `Get-ChildItem -Recurse -File -Filter *.md`
- `npm run check-data`
- `npx ts-node tools/test-queries/db-checks/check_app_config.ts`
