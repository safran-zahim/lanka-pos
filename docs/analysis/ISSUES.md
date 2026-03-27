# Known Issues & Errors

Last updated: 2026-03-27

## Current Linting Errors
- **`src/index.css`**:
  - `Unknown at rule @custom-variant` (Line 2)
  - `Unknown at rule @apply` (Line 6) -> These appear to be false positives related to TailwindCSS setup or VS Code linting rules.
- **`src/layouts/AdminLayout.tsx`**:
  - `Receipt` is declared but its value is never read.

## Current Test Baseline Failures

- **`client/src/__tests__/settingsStore.test.ts`**
  - Fails with `ECONNREFUSED` because the test currently attempts a live backend connection (`localhost:3000`) instead of mocking fetch.
- **`client/src/__tests__/ProductList.test.tsx`**
  - Fails because `useNavigate()` is used without a Router wrapper in test render setup.

These failures were present during the shadcn migration batches and are not caused by backend contract changes.

## Potential Runtime Issues

- **`src/components/admin/settings/BrandManager.tsx` & `UnitManager.tsx`**:
  - `handleDelete` functions lack `try-catch` blocks, meaning database errors during deletion won't handle gracefully (though rare).

## Pending Fixes
- Add mocked API layer in frontend tests for store update calls.
- Wrap router-dependent component tests with `MemoryRouter` (or a shared test render utility).
- Continue phased shadcn migration for remaining complex modal surfaces.
