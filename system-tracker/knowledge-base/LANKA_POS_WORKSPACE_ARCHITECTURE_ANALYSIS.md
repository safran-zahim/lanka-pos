# Lanka POS - Workspace Architecture Analysis

Last updated: 2026-03-28

## 1. System Overview

Lanka POS is a full-stack system with:

- Backend: Node.js + Express + TypeScript + Prisma
- Frontend: React + Vite + TypeScript + Tailwind
- Auth: JWT with role-based middleware
- Data: Prisma models for staff, products, sales, shifts, settings, subscriptions, and supporting entities

## 2. Backend Feature Map

### 2.1 Authentication and Access Control

- Routes: `src/routes/auth.routes.ts`
- Controllers: `src/controllers/auth.controller.ts`
- Middleware: `src/middleware/auth.middleware.ts`
- JWT utils: `src/utils/jwt.ts`

Flow:
- `POST /auth/login` -> validate credentials -> generate JWT -> return staff + subscription status
- `GET /auth/me` -> authenticate token -> return current user
- Access chain for protected endpoints:
  - `authenticate` -> `authorize(roles)` -> `requireActiveSubscription`

Role intent:
- `super_admin`: developer-level role and subscription management authority
- `admin`, `manager`, `cashier`: operational roles under subscription restrictions

### 2.2 Sales, POS, Returns, Held Sales

- Routes: `src/routes/sales.routes.ts`
- Controller: `src/controllers/sales.controller.ts`

Key responsibilities:
- Checkout processing with stock validation
- Batch-aware line-item handling and FIFO assignment
- Return processing with parent sale checks and prorated adjustments
- Held/parked sale lifecycle
- Daily/monthly sales summaries
- Sale notes updates

### 2.3 Products and Inventory

- Routes: `src/routes/product.routes.ts`
- Controller: `src/controllers/product.controller.ts`

Key responsibilities:
- Product CRUD and active/inactive status
- Stock computation from purchase and sale aggregates
- Product batch lookup for FIFO and POS selection
- Low-stock reporting (Aggregated via `Product` stock vs `reorderLevel`)
- Sidebar alerts: Real-time "Low Stock" badge in `AdminLayout` fetching from `/reports/dashboard`.

### 2.4 Purchases and Supplier Payments

- Routes: `src/routes/purchase.routes.ts`, `src/routes/supplier.routes.ts`
- Controllers: `src/controllers/purchase.controller.ts`, supplier controller

Key responsibilities:
- Purchase creation with `PurchaseItem` batch creation
- Purchase payment tracking
- Purchase status derivation (`PENDING`, `PARTIAL`, `COMPLETED`)
- Supplier management and related purchase history

### 2.5 Customers, Credit, Loyalty

- Routes: `src/routes/customer.routes.ts`
- Controller: `src/controllers/customer.controller.ts`

Key responsibilities:
- Customer CRUD
- Points ledger tracking
- Due amount and customer payment tracking
- Customer transaction and history views
- **Audit Logging**: Customer create, update, and delete mutations are wrapped in `prisma.$transaction` with `logAudit` calls capturing actor identity and before/after data snapshots.

### 2.6 Shifts, Drawer, and Cashflow

- Routes: `src/routes/shift.routes.ts`
- Controller: `src/controllers/shift.controller.ts`

Key responsibilities:
- Open/active/close shift lifecycle
- Drawer expected cash calculation
- Petty cash IN/OUT entries
- Shift reporting and variance handling

### 2.7 Settings and Subscription

- Settings routes/controller: `src/routes/settings.routes.ts`, `src/controllers/settings.controller.ts`
- Subscription routes/controller: `src/routes/subscription.routes.ts`, `src/controllers/subscription.controller.ts`
- App config helper: `src/utils/appConfig.ts`

Key responsibilities:
- Key-value settings management
- Restricted developer settings handling
- Subscription status management: `super_admin` controlled single-entity configuration
- Models: `AppConfig`, `SubscriptionHistory` (Audit Log)

### 2.8 Staff and Admin Operations

- Routes: `src/routes/staff.routes.ts`, `src/routes/bulk.routes.ts`, `src/routes/expense.routes.ts`, `src/routes/transaction.routes.ts`
- Controllers: staff, bulk, expense, transaction controllers

Key responsibilities:
- Staff management and password reset
- Bulk import/export operations
- Expense and transaction dashboards
- **Business Intelligence (BI)**: Centralized reporting via `src/controllers/reports.controller.ts` providing multi-dimensional aggregations (Top Performers, Brand Mix, Inventory Velocity).
- **Audit Logging**: All staff mutations (create, update, delete, password reset) are wrapped in `prisma.$transaction` with `logAudit` for full traceability.

## 3. Frontend Feature Map

### 3.1 Core Routing and Layout

- App entry: `client/src/App.tsx`
- Protected routing: `client/src/components/ProtectedRoute.tsx`
- Layouts: `client/src/layouts/POSLayout.tsx`, `client/src/layouts/AdminLayout.tsx`

### 3.2 POS Runtime

- Main POS page: `client/src/pages/POS.tsx`
- Related components:
  - Checkout and payment modals
  - Held sale and restore flow
  - Receipt rendering and print/share
  - Register manager and active shift modals

### 3.3 Dashboard and Admin Modules

Representative pages:
- `client/src/pages/Dashboard.tsx`
- `client/src/pages/admin/ProductList.tsx`
- `client/src/pages/admin/SalesHistoryPage.tsx`
- `client/src/pages/admin/TransactionsPage.tsx`
- `client/src/pages/admin/ReportsPage.tsx`
- `client/src/pages/admin/SettingsPage.tsx`
- `client/src/pages/admin/ReceiptSettingsPage.tsx`
- `client/src/pages/admin/ExpensesPage.tsx`
- `client/src/pages/admin/SubscriptionStatusPage.tsx` (Replaced SubscriptionPlans.tsx)
- `client/src/pages/admin/SystemSubscriptionPage.tsx`
- `client/src/components/shared/SubscriptionIndicator.tsx`: Shared component for persistent billing status across POS and Admin headers.

### 3.4 State and Hooks

Stores:
- `client/src/store/useAuthStore.ts`
- `client/src/store/useCartStore.ts`
- `client/src/store/useSettingsStore.ts`
- `client/src/store/useToast.ts`

Hooks:
- `client/src/hooks/useCurrency.ts`
- `client/src/hooks/useLocale.ts`
- `client/src/hooks/useDigitalReceipt.ts`

### 3.5 UI Standardization Workstream (In Progress)

- Migration target: shadcn-style component system with incremental adapter rollout.
- Sequence in execution: Phase 1 -> Phase 2 -> Phase 4 -> Phase 5.
- Current status:
  - Phase 1 foundation started in client (`cn` utility + semantic theme tokens).
  - Phase 2 started by replacing shared `Button` with CVA-based adapter and beginning layout-level button migration.
  - Phase 4 in progress with shadcn `Dialog` primitive adoption across low-risk POS modals.
  - Phase 5 in progress with shadcn `Card` and `Badge` adoption in shared/admin dashboard surfaces.
- Guardrail: Backend routes/controllers/middleware and API contracts are unchanged during UI migration.

## 4. Linkage Matrix (From -> To)

### 4.1 POS Checkout

- From: `client/src/pages/POS.tsx` and checkout modal components
- To API: `POST /sales/checkout`
- Middleware: authenticate -> authorize -> requireActiveSubscription
- Controller: `sales.controller.checkout` (Optimized with bulk batch fetching and grouped aggregates to prevent transaction timeouts during multi-item sales).
- DB models touched: `Sale`, `SaleItem`, `Shift`, `Customer`, `CustomerPointLedger`, `PurchaseItem` (stock deduction).

### 4.2 Product Inventory Listing

- From: `client/src/pages/admin/ProductList.tsx`
- To API: `GET /products`
- Controller: `product.controller.getProducts`
- DB models touched: `Product`, `PurchaseItem`, `SaleItem`, related metadata tables

### 4.3 Purchase + Payment

- From: `client/src/pages/admin/PurchasePage.tsx` and `PurchaseDetailPage.tsx`
- To API: `POST /purchases`, `POST /purchases/:id/payments`
- Controller: purchase controller methods
- DB models touched: `Purchase`, `PurchaseItem`, `PurchasePayment`, `Expense`, `Shift`

### 4.4 Return Processing

- From: return modals/pages in sales detail and POS workflows
- To API: `POST /sales/checkout` with return payload and `parent_sale_id`
- Controller: `sales.controller.checkout`
- DB models touched: `Sale`, `SaleItem`, `Customer`, `CustomerPointLedger`

### 4.5 Settings and Subscription Control

- From: settings/subscription admin pages
- To API: `/settings/*`, `/subscription/*`
- Controllers: settings/subscription controllers
- DB models touched: `Setting`, `AppConfig`, `SubscriptionHistory`

## 5. Request Processing Lifecycle

Generic backend request processing:

1. Router matches endpoint in `src/routes/*`.
2. `authenticate` validates JWT and sets `req.user`.
3. `authorize` validates role (if route protected by roles).
4. `requireActiveSubscription` blocks non-active subscriptions except `super_admin`.
5. Controller validates input (`zod` in key controllers), performs Prisma operations, returns response.
6. Frontend handles response, updates Zustand state, and renders UI feedback.

## 6. Technical Spec Highlights

- Security:
  - Bcrypt password hashing + plaintext auto-upgrade path during login
  - JWT auth across API routes
  - Role and subscription gating at middleware layer

- Inventory correctness:
  - Batch-aware stock math using purchases minus sales
  - FIFO behavior when no explicit batch selected
  - Return checks guard against over-refunds

- Cashflow model:
  - Shift-based expected cash aggregation
  - Supplier payments and expenses influence shift totals
  - Petty cash included in register calculations

## 7. Database Snapshot and Verification

### 7.1 Available DB verification command

- `npm run check-data`

### 7.2 Latest observed result

- A successful snapshot was previously recorded in this session with counts (staff/products/sales/etc.).
- Current DB checks are environment-sensitive because active Prisma datasource expects PostgreSQL while shell `DATABASE_URL` can be set to SQLite.

### 7.3 Current blocker

- Prisma datasource protocol mismatch can fail checks:
  - provider expects `postgresql://` while env contains `file:./dev.db`, or vice versa.

### 7.4 Resolution guidance

- Align `DATABASE_URL` with the active provider in `prisma/schema.prisma` before running DB snapshot scripts.
- Re-run:
  - `npm run check-data`
  - `npx ts-node tools/test-queries/db-checks/check_app_config.ts`

## 8. Known Gaps (Architecture-level)

- Customer credit limit enforcement path should be verified in checkout for strict policy behavior.
- ~~Audit log coverage for critical mutations should be expanded for compliance traceability.~~ **CLOSED**: Audit logging now covers Products, Settings, Staff (4 actions), and Customers (3 actions).
- ~~Reconciliation/reporting for cash variance over time can be strengthened.~~ **CLOSED**: Shift Reconciliation dashboard implemented in Reports section.
- **Open**: Audit logging not yet applied to Expenses and Petty Cash mutations.

## 9. Maintenance

When code or routes change, update this file together with:

- `system-tracker/CENTRAL_UPDATE_PROMPT.md`
- `system-tracker/MARKDOWN_REGISTRY.md`
- `system-tracker/docs-updates/daily-doc-updates.md`

This keeps architecture knowledge, docs, and tracker automation aligned.

## 10. Core Database Logics & File Responsibilities

### 10.1 `Product` & `PurchaseItem`
- **Why it exists**: Tracks catalog entries and actual physical inventory batches.
- **Data Flow**: `PurchaseItem` records define independent batch lifecycles (`batch_id`). Checkout deducts from oldest batches first (FIFO) managed by `sales.controller.ts`.
- **Key Attributes**:
  - `stock`: Global aggregated tracker maintained mathematically (`Purchases` - `Sales` + `Refunds`).
  - `reorderLevel`: Defines the UI trigger point for "Low Stock" orange alerts.

### 2. Receipt Configuration Settings
The system supports extensive receipt customization via the `Setting` model (JSON-based key-value pairs).
- **Core Fields:**
    - `receiptHeader`: Business name.
    - `receiptDescription`: Business description/tagline. [NEW]
    - `receiptAddress`: Address Line 1.
    - `receiptAddressLine2`: Address Line 2. [NEW]
    - `receiptPhone`, `receiptEmail`: Contact details.
    - `taxID`: Relocated to Business Info.
- **Footer Logic:**
    - `receiptFooter`: Defaults to "Thank you for your business!".
    - `developerFooter`: Managed by Super Admin, defaults to developer branding.
    - `developerFooterEnabled`: Toggle for developer branding.

### 10.2 `Sale` & `SaleItem`
- **Why it exists**: Records financial transactions, customer receipts, and dictates stock consumption.
- **Data Flow**: `POST /sales/checkout` wraps all creations (Sale, SaleItem, Shift Updates, Credit Updates) into a singular heavy Prisma `$transaction`.
- **Key Attributes**:
  - `parentSaleId`: Essential for Refunds to map returning lines back to the origin timeline and prevent over-refunding mathematically.
  - `dueAmount`: Tracks credit balances owed by specific `Customer` entities.

### 10.3 `Setting` & `AppConfig`
- **Why it exists**: Key-value metadata table bypassing the need for `.env` redeployments.
- **Limitations**: Updated iteratively via frontend looping. A major React architecture constraint here is preventing referential equality re-renders (Infinite Loops) from spamming the DB with `PUT` updates. Required the explicit use of `useCallback` when passing update schemas to nested components.

## 11. Architecture Update History

*Every major logic/architectural change must be logged here to track what was done and when.*

- **[2026-03-26]**: Simplified Subscription System. Removed `SubscriptionPlan` catalog. Moved to single-system config in `AppConfig`. Added `SubscriptionHistory` for audit trails. Implemented read-only status view for admins and developer control panel for super_admins. Centralized gating at login.
- **[2026-03-27]**: Dashboard Intelligence & UI Overhaul. Created `reports.controller.ts` for advanced BI (Top Performers, Brand Mix, Slow Movers). Refactored `Dashboard.tsx` with premium gradient KPI cards. Integrated dynamic low-stock badge into `AdminLayout` sidebar. Optimized `sales.controller.ts` checkout logic for bulk data processing.
- **[2026-03-27]**: Shadcn UI migration kickoff (Phase 1 + Phase 2 Batch A). Added client UI foundations (`class-variance-authority`, Radix `Slot`, shared `cn` utility), introduced semantic Modern Retail tokens in `client/src/index.css`, replaced `client/src/components/ui/Button.tsx` with adapter-compatible CVA implementation, and migrated layout-level button usage in `AdminLayout` and `POSLayout`. Backend/middleware contracts remain unchanged.
- **[2026-03-27]**: Shadcn migration expansion (Phase 4 + Phase 5 partial). Added shadcn `Dialog`, `Card`, and `Badge` primitives; migrated low-risk modal set (`DiscountModal`, `EditPriceModal`, `EditTaxModal`, `HoldSaleModal`) to dialog-based patterns; standardized shared/dashboard/admin surfaces (`SubscriptionIndicator`, dashboard quick actions, low stock report wrappers/badges/actions). API payload contracts and backend middleware behavior remain unchanged.
- **[2026-03-27]**: Operational Excellence Phase 2 & 3. Deployed `AuditLog` Prisma model and `logAudit` atomic utility. Instrumented Product, Settings, Staff (4 actions), and Customer (3 actions) mutations with full audit trails. Added `getShiftReconciliation` backend endpoint and Reconciliation tab in Reports Dashboard with CSV export. Deployed global `NotificationCenter` (Zustand store + shadcn UI) with background `useStockMonitor` hook to both Admin and POS layouts. Refactored `NotificationCenter.tsx` and Reconciliation tab to use shadcn `Card`, `Button`, `Badge` primitives.
- **[2026-03-28]**: Build verification and portability note. Full-system build was executed from root with backend dependency install, Prisma client generation, and client production build. A cross-platform script gap was confirmed: root `build` uses `tsc || true`, which fails on Windows because `true` is Unix-only. Current reliable Windows sequence: `npm install --include=dev`, `npx prisma generate`, `npm --prefix client run build`.
- **[2026-03-28]**: Component migration documentation sync. Shadcn progress docs were reconciled with implemented frontend component inventory (expanded primitive set under `client/src/components/ui` including navigation, form, feedback, data-display, and advanced primitives), complex modal migration coverage, and ongoing shared layout-shell standardization. Responsive-first behavior is now treated as a standing migration requirement.
- **[2026-03-30]**: Stabilization and test-layout standardization. Backend build script was made Windows-safe (`tsc` chain without Unix-only `true`), Prisma seed/reset scripts were aligned with current `AppConfig` schema (no `subscriptionPlanId` writes), frontend compile/test blockers were fixed (missing `Input` import, Vitest alias + test isolation), and browser e2e assets were centralized to `tools/testing/` (`tools/testing/playwright.config.ts`, `tools/testing/e2e/`) instead of app source folders. Local documentation baseline was updated toward PostgreSQL-standard workflows.
- **[2026-03-30]**: POS-first shadcn consistency refinement. Cleaned conflicting utility classes and strengthened semantic token usage in `POS.tsx` (brand filter, category/product state styling, destructive action button state). Normalized selected Login utility syntax to modern class forms (`bg-linear-*`, `bg-size-*`, `mask-*`, scale aliases) while preserving behavior; touched files revalidated with clean diagnostics and successful frontend build.
- **[2026-03-30]**: Continuation cleanup for dashboard/admin utility consistency. Normalized remaining scale utility classes in `SalesHistoryDashboard.tsx`, `AddProductModal.tsx`, and `Dashboard.tsx` to preferred forms (table min-widths, batch summary max-width, modal min-height, chart heights). Post-change diagnostics for touched files are clean, and frontend build/unit tests continue to pass.
- **[2026-03-31]**: Backend type-safety and E2E stability pass. Hardened controller write paths by replacing unsafe casts (`as any`) with explicit Prisma field mappings in Customer, Supplier, and Expense flows; expanded product endpoint capabilities with server-side pagination/filtering and batch summary endpoint support for admin/product dashboards; optimized reports insight computations to reduce N+1 query patterns; validated E2E stack with centralized Playwright config plus interaction-focused smoke coverage.
