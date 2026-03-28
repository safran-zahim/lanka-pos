# Changelog Sync - Usage Instructions

This guide explains how to use the changelog synchronization script to keep your root `CHANGELOG.md` in sync with your system-tracker daily logs.

## Quick Start

### Preview what would be synced (no changes)
```bash
npm run changelog:check
```

### Sync changelog (interactive mode)
```bash
npm run changelog:sync
```

### Extract entries from past N days (default 30)
```bash
DAYS=7 npm run changelog:sync
```

---

## Understanding the Sync Process

### How it Works

1. **Read Daily Logs**: Script scans `system-tracker/daily/*.md` for the past 30 days (configurable)
2. **Filter Entries**: Extracts only entries marked with `User-visible behavior: Yes`
3. **Categorize**: Groups entries into:
   - Features
   - Bug Fixes
   - UI Improvements
   - Refactoring
   - Breaking Changes
   - Other
4. **Generate**: Creates markdown-formatted changelog section
5. **Preview**: Shows you exactly what will be added (check mode) or asks for confirmation (sync mode)
6. **Apply**: If confirmed, prepends new entries to root `CHANGELOG.md`

### Two Workflows

#### Workflow A: Review-First (Recommended)
```bash
# 1. Preview what will be synced
npm run changelog:check

# 2. Review output and read through your daily logs to verify accuracy
# 3. If satisfied, run sync with confirmation
npm run changelog:sync
# → Answer 'y' when prompted

# 4. Review changes
git diff CHANGELOG.md

# 5. Commit
git add CHANGELOG.md
git commit -m "docs: update changelog from daily logs"
git push
```

#### Workflow B: Automated (for CI/CD)
```bash
MODE=sync npm run changelog:sync
# Proceeds without confirmation prompt
```

---

## Daily Log Setup

### Mark Entries as "User-Visible"

For an entry to appear in the synced changelog, mark it as user-visible:

```markdown
### 14:30
- Time: 14:30
- Summary: Fixed inventory sync not updating after batch sale
- Implemented:
  - Updated SaleController to refresh inventory cache
  - Fixed batch quantity deduction logic
- User-visible behavior: Yes  ⬅️ THIS IS KEY
- Errors found: Inventory not syncing
- Errors fixed: Added cache refresh
```

### Entries that Should be Marked "Yes"
- New features
- Bug fixes visible to users
- UI/UX improvements
- Breaking changes
- Important performance improvements

### Entries that Should be Marked "No"
- Internal refactoring
- Code cleanup
- Infrastructure changes (unless user-facing)
- Documentation-only changes
- Testing improvements

---

## Understanding the Output

When you run the sync, it groups and formats entries like this:

```markdown
## [2026-03-20 to 2026-03-28]

### Features

- **Implemented new batch processing system**
  - Added batch creation workflow
  - Added batch tracking to inventory
  - ... and 1 more

### Bug Fixes

- **Fixed inventory sync not updating after batch sale**
  - Updated SaleController to refresh inventory cache
  - Fixed batch quantity deduction logic

### UI Improvements

- **Migrated modals to shadcn/ui components**
  - Replaced custom modal styles with shadcn Dialog
  - Updated button styles for consistency
  - ... and 2 more
```

The script automatically:
- Extracts summary from daily logs
- Pulls top implemented items (limited to 2-3 for conciseness)
- Groups by type for easy scanning
- Handles `...and X more` for entries with many items

---

## Troubleshooting

### No user-visible changes found

**Problem**: Script runs but finds nothing to sync
```
⚠️ No user-visible changes found in daily logs
```

**Solution**: 
1. Open a recent daily log: `system-tracker/daily/2026-03-28.md`
2. Find entries you want to sync
3. Add `User-visible behavior: Yes` to those entries
4. Re-run `npm run changelog:sync`

### CHANGELOG.md format looks wrong

**Problem**: Output has malformed markdown

**Solution**:
1. Check the daily log format using template: `system-tracker/templates/daily-template.md`
2. Verify `- **Summary**:` format is exact
3. Ensure bullet points under "- **Implemented**:" are properly formatted
4. Run `npm run changelog:check` again to preview before syncing

### Want to customize categories

**Problem**: Entries are being grouped incorrectly

**Solution**: Edit `tools/scripts/sync-changelog.js` and update the `categorizeEntries()` function:
```javascript
} else if (summary.includes('my-keyword')) {
  categories['My Custom Category'].push(entry);
}
```

### Manually adjust CHANGELOG.md

After syncing, you can manually edit `CHANGELOG.md`:
- Move entries between sections
- Combine similar entries
- Fix wording or formatting
- Add context notes

Just remember that the script will prepend new entries on next run, so any custom edits should be in the manually-maintained format.

---

## Best Practices

### 1. Update Daily Logs Consistently
- Log changes **during** or **immediately after** completing work
- Don't wait until end of day
- This prevents losing important details

### 2. Mark User-Visible Correctly
- Be conservative: when in doubt, mark "Yes"
- It's better to have extra info in CHANGELOG than miss changes
- Reviewers can manually remove non-essential items later

### 3. Review Before Syncing
- Always run `npm run changelog:check` first
- Review the preview for accuracy
- Adjust daily logs if entries are unclear

### 4. Commit CHANGELOG Separately
- Don't bundle CHANGELOG.md changes with code changes
- Easier to review and revert if needed
```bash
git commit -m "docs: update changelog from daily logs"
git commit -m "feat: implement new dashboard widget" --allow-empty
```

### 5. Run Before Releases
- Use `npm run changelog:sync` as part of your release process
- Ensures CHANGELOG.md is current
- Gives you a summary of what's being released

---

## Integration with Release Workflow

### When releasing a new version:

```bash
# 1. Create release branch
git checkout -b release/v1.2.0

# 2. Update version numbers in package.json, etc.
npm version minor

# 3. Sync changelog from daily logs
npm run changelog:sync
# → Review and confirm

# 4. Review changes
git diff
git diff CHANGELOG.md

# 5. Commit
git add .
git commit -m "chore: prepare v1.2.0 release"

# 6. Tag release
git tag -a v1.2.0 -m "Release v1.2.0"

# 7. Push
git push origin release/v1.2.0 --tags
```

---

## Advanced Usage

### Scan deeper into history
```bash
# Check past 90 days instead of default 30
DAYS=90 npm run changelog:sync
```

### Dry-run mode (just preview)
```bash
# Show what would change without any prompts
npm run changelog:check
```

### Combine daily logs for manual editing
```bash
# Just show preview without interactive prompts
MODE=check npm run changelog:sync
```

---

## Script Configuration Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `DAYS` | `30` | Number of days to scan for daily logs |
| `MODE` | `preview` | `preview` (check), `sync` (confirm), `patch` (generate patch file) |

Example:
```bash
DAYS=7 MODE=sync npm run changelog:sync
```

---

## Questions?

See:
- **Daily Log Format**: `system-tracker/templates/daily-template.md`
- **Maintenance Guide**: `system-tracker/docs-updates/CHANGELOG_MAINTENANCE_GUIDE.md`
- **Central Workflow**: `system-tracker/CENTRAL_UPDATE_PROMPT.md`
- **Completion Checklist**: `system-tracker/templates/COMPLETION_CHECKLIST.md`
