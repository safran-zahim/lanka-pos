# System Docs

This folder is the centralized home for project documentation.

## Structure

- `api_documentation.md`: API reference.
- `batch/`: Batch and FIFO implementation docs.
- `guides/`: Setup, build, and desktop usage guides.
- `operations/`: Operational references such as credentials.
- `analysis/`: System analysis and issue/feature summaries.
- `specs/`: Formal requirements/specification docs.

## Main Entry Points

- `docs/api_documentation.md`
- `docs/guides/LOCAL_SETUP.md`
- `docs/guides/BUILD.md`
- `docs/operations/CREDENTIALS.md`
- `docs/specs/srs.md`
- `docs/analysis/SHADCN_UI_MIGRATION_PROGRESS.md`

## Current Implementation Status (2026-03-27)

- Frontend UI standardization to shadcn is in progress.
- Completed slices:
	- shadcn CLI initialization in client workspace.
	- Shared `Button` compatibility adapter aligned to existing app props.
	- Base primitives added: Dialog, Card, Badge.
	- Migrated low-risk modal set and selected admin/dashboard/shared surfaces.
- Scope guardrail:
	- Migration is UI-focused and keeps backend routes, middleware, and API payload contracts unchanged.

## Rule

Add new project documentation under `docs/` (or `system-tracker/` for tracker workflow docs), not at repository root.

## Test and Docs Placement

- Place browser e2e test assets in `tools/testing/` (for example `tools/testing/e2e/`).
- Keep test workflow writeups and READMEs under `docs/` or `system-tracker/` only.