# Shadcn UI Migration Progress

Last updated: 2026-03-27

## Objective

Standardize the frontend UI on shadcn-style primitives with minimal risk and no backend contract disruption.

## Scope Boundary

- In scope:
  - `client/src` UI components and page surfaces.
  - Frontend styling/token and component standardization.
- Out of scope:
  - Backend routes/controllers/middleware behavior.
  - API payload schema changes.
  - Database schema changes.

## Sequence in Execution

1. Phase 1: Foundation setup
2. Phase 2: Button-first rollout
3. Phase 4: Dialog/modal standardization
4. Phase 5: Data-display and navigation surface standardization

## Completed Work

### Foundation and Setup

- shadcn CLI initialized in client.
- Import alias support configured (`@/* -> src/*`).
- Shared utility (`cn`) aligned with shadcn utility pattern.

### Button Standardization

- Shared button migrated to shadcn-compatible implementation while preserving app compatibility props:
  - `variant`
  - `size`
  - `loading`
  - `icon`
  - `fullWidth`

### Added Primitives

- `Dialog`
- `Card`
- `Badge`

### Migrated Modal Batch

- `DiscountModal`
- `EditPriceModal`
- `EditTaxModal`
- `HoldSaleModal`
- `EditCartItemModal`
- `SelectBatchModal`

### Migrated Surface Batch

- Shared subscription indicator UI.
- Dashboard quick action buttons.
- Low stock report key wrappers/actions/status chips.

## Verification Summary

- Build status: passing (`npm run build`).
- Test status: baseline failures remain in existing tests:
  - `settingsStore.test.ts` (live backend call / fetch mocking gap)
  - `ProductList.test.tsx` (missing Router wrapper in test render)

## Risk Handling

- Migration performed in incremental batches to isolate regressions.
- Existing business logic and API contracts preserved.
- Compile validation executed after each major migration batch.

## Next Steps

1. Continue complex modal migrations (`ReturnModal`, `POSCashModal`, `ReceiptModal`, `ActiveRegisterModal`, `UnifiedCheckoutModal`).
2. Expand card/badge/button consistency in remaining admin and POS pages.
3. Resolve frontend test harness issues (fetch mocking and Router test wrapper) to improve CI confidence during ongoing migration.