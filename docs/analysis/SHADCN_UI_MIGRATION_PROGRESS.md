# Shadcn UI Migration Progress

Last updated: 2026-03-28

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
- `Alert`, `AlertDialog`, `Avatar`, `Breadcrumb`
- `Calendar`, `Checkbox`, `Collapsible`, `Command`
- `ContextMenu`, `Drawer`, `DropdownMenu`, `Form`
- `HoverCard`, `Label`, `Menubar`, `NavigationMenu`
- `Pagination`, `Popover`, `Progress`, `RadioGroup`
- `Resizable`, `ScrollArea`, `Select`, `Separator`
- `Sheet`, `Skeleton`, `Slider`, `Switch`
- `Table`, `Tabs`, `Textarea`, `Tooltip`
- `Accordion`, `AspectRatio`

### Migrated Modal Batch

- `DiscountModal`
- `EditPriceModal`
- `EditTaxModal`
- `HoldSaleModal`
- `EditCartItemModal`
- `SelectBatchModal`
- `POSCashModal`
- `ReturnModal`
- `ReceiptModal`
- `UnifiedCheckoutModal`
- `ActiveRegisterModal`
- `HeldSalesList`

### Migrated Surface Batch

- Shared subscription indicator UI.
- Dashboard quick action buttons.
- Low stock report key wrappers/actions/status chips.
- Shared page shell pattern applied via primary layout wrappers for consistent page framing.
- POS inline overlays (return-history and bill-note) converted to dialog pattern.
- Customer admin modal shell aligned to shared dialog/button primitives.

## Current Coverage Snapshot

- `client/src/components/ui` now contains a broad shadcn-style primitive set (40+ files).
- Core interaction categories are covered:
  - Layout/shell and navigation primitives
  - Form and input primitives
  - Feedback and overlay primitives
  - Data display and utility primitives
- Migration posture: foundation and component library are substantially in place; remaining work is page-by-page adoption consistency.

## Verification Summary

- Build status: passing (`npm run build`).
- Test status: baseline failures remain in existing tests:
  - `settingsStore.test.ts` (live backend call / fetch mocking gap)
  - `ProductList.test.tsx` (missing Router wrapper in test render)

## Risk Handling

- Migration performed in incremental batches to isolate regressions.
- Existing business logic and API contracts preserved.
- Compile validation executed after each major migration batch.
- Mobile responsiveness is treated as a standing requirement for all subsequent UI migration work.

## Next Steps

1. Continue page-level adoption to ensure all remaining admin/POS surfaces use shared primitives consistently.
2. Enforce responsive-first checks (small-screen layout, overflow, touch targets) in each migration batch.
3. Resolve frontend test harness issues (fetch mocking and Router test wrapper) to improve CI confidence during ongoing migration.