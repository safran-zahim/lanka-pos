# Feature/Fix Completion Checklist

Use this checklist after completing a feature, bug fix, refactoring, or other significant change to ensure all documentation is updated and processes are followed.

## Feature/Fix Overview
- [ ] **What was implemented?** (one sentence summary)
  
- [ ] **Scope**: Feature | Bug Fix | Refactoring | UI Update | Architecture | Other: ____
  
- [ ] **Affected areas**: (e.g., POS Register, Inventory, Authentication, etc.)

---

## Code Verification

- [ ] **Build passes**: `npm run build` (root) and `npm --prefix client run build` (client)
  
- [ ] **No console errors**: Verified in dev tools / server logs
  
- [ ] **No TypeScript errors**: `npm run build` shows no type errors
  
- [ ] **Tests updated/passing** (if applicable):
  - [ ] Unit tests: `npm --prefix client run test` (client)
  - [ ] Backend tests: (if applicable)
  
- [ ] **No regressions**: Manually tested existing features that could be affected

---

## Documentation Updates (REQUIRED)

### Daily System-Tracker Log
- [ ] **Created/Updated today's entry** in `system-tracker/daily/YYYY-MM-DD.md`
  
  **Entry template:**
  ```
  ### HH:MM
  - Time: HH:MM
  - Summary: [What was done]
  - Implemented: [List implemented items]
  - Files touched: [Key files]
  - Errors found: [Any issues encountered]
  - Errors fixed: [How issues were resolved]
  - Pending issues: [Outstanding items]
  - Verification run: [Commands used to verify]
  - Result: [Build/test results]
  - Next action: [What comes next]
  - User-visible behavior: Yes | No  ⬅️ IMPORTANT for changelog sync
  ```

### Root CHANGELOG.md (if user-visible)
- [ ] **Mark as "user-visible" in daily log** (if this should appear in CHANGELOG.md)
  
- [ ] **Run changelog sync** (after merging to main):
  ```bash
  npm run changelog:sync
  ```
  
- [ ] **Manually review** sync output before committing CHANGELOG.md

### Architecture/Routes/Models Changes
- [ ] **Updated architecture notes** (if applicable):
  - If routes changed: Update `system-tracker/knowledge-base/LANKA_POS_WORKSPACE_ARCHITECTURE_ANALYSIS.md`
  - If models changed: Document new/modified schema
  - If flows changed: Update request-flow diagrams or descriptions

### API Documentation (if applicable)
- [ ] **Updated** `docs/api_documentation.md` with:
  - [ ] New endpoints
  - [ ] Modified endpoint behavior
  - [ ] Changed request/response formats
  - [ ] New error codes

---

## Testing Verification

### High-Risk Areas (if your change touches these)
- [ ] **POS Register Flow**: Complete sale flow works (select items → checkout → payment)
  
- [ ] **Inventory**: Stock updates correctly after sale
  
- [ ] **Authentication**: Login/logout works, session persists
  
- [ ] **Database**: No data corruption, migrations pass if DB schema changed

### Test Coverage
- [ ] **Unit tests**: Added/updated tests for new code
  
- [ ] **Integration tests**: (if applicable) Tested component interactions
  
- [ ] **Manual testing**: Tested in both light and dark modes

---

## Pre-commit Validation

- [ ] **All changes staged**: `git status` shows correct files
  
- [ ] **No debugging code**: Removed console.logs, debugger statements, commented-out code
  
- [ ] **Code follows project standards**: Checked eslint/prettier (if configured)
  
- [ ] **Daily log entry verified**: Matches format in template
  
- [ ] **Ready to commit**: Can run `git commit` without --no-verify

---

## Pre-Push Validation

- [ ] **Changelog sync ready** (if user-visible changes):
  ```bash
  npm run changelog:sync
  ```
  will be run after merge
  
- [ ] **No sensitive data**: No API keys, passwords, or credentials in code
  
- [ ] **No large files**: All files under 10MB
  
- [ ] **Commit message is clear**: Describes what and why

---

## Sign-Off

- [ ] **Developer**: _________________ (name/GitHub handle)
  
- [ ] **Date completed**: _____________
  
- [ ] **Code review** (if required): _________________ (reviewer)
  
- [ ] **Ready to merge**: Yes | Needs revisions

---

## Quick Reference

| Task | Command |
|------|---------|
| Create today's daily log | `cp system-tracker/templates/daily-template.md system-tracker/daily/$(date +\%Y-\%m-\%d).md` |
| Check update status | `npm run changelog:status` |
| Preview changelog sync | `npm run changelog:check` |
| Run changelog sync | `npm run changelog:sync` |
| View maintenance guide | `cat system-tracker/docs-updates/CHANGELOG_MAINTENANCE_GUIDE.md` |

---

## Notes

- **Emergency bypass**: Only use `git commit --no-verify` in truly exceptional cases, and document within 24 hours
- **Questions?** Refer to `system-tracker/CENTRAL_UPDATE_PROMPT.md` or `system-tracker/docs-updates/CHANGELOG_MAINTENANCE_GUIDE.md`
- **Feedback**: Improve this checklist by updating this file after using it
