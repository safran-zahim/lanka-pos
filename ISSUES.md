# Known Issues & Errors

## Current Linting Errors
- **`src/index.css`**:
  - `Unknown at rule @custom-variant` (Line 2)
  - `Unknown at rule @apply` (Line 6) -> These appear to be false positives related to TailwindCSS setup or VS Code linting rules.
- **`src/layouts/AdminLayout.tsx`**:
  - `Receipt` is declared but its value is never read.

## Potential Runtime Issues

- **`src/components/admin/settings/BrandManager.tsx` & `UnitManager.tsx`**:
  - `handleDelete` functions lack `try-catch` blocks, meaning database errors during deletion won't handle gracefully (though rare).

## Pending Fixes
- None identified in open files specific to logic yet.
