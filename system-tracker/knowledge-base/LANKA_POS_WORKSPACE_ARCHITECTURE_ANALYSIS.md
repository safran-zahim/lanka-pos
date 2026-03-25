# Lanka POS - Workspace Architecture Analysis

Last updated: 2026-03-25

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
- Low-stock reporting

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
- Subscription status/plan management (`super_admin` controlled)

### 2.8 Staff and Admin Operations

- Routes: `src/routes/staff.routes.ts`, `src/routes/bulk.routes.ts`, `src/routes/expense.routes.ts`, `src/routes/transaction.routes.ts`
- Controllers: staff, bulk, expense, transaction controllers

Key responsibilities:
- Staff management and password reset
- Bulk import/export operations
- Expense and transaction dashboards

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
- `client/src/pages/admin/SubscriptionPlans.tsx`

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

## 4. Linkage Matrix (From -> To)

### 4.1 POS Checkout

- From: `client/src/pages/POS.tsx` and checkout modal components
- To API: `POST /sales/checkout`
- Middleware: authenticate -> authorize -> requireActiveSubscription
- Controller: `sales.controller.checkout`
- DB models touched: `Sale`, `SaleItem`, `Shift`, `Customer`, `CustomerPointLedger`

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
- DB models touched: `Setting`, `AppConfig`, `SubscriptionPlan`

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
- Audit log coverage for critical mutations should be expanded for compliance traceability.
- Reconciliation/reporting for cash variance over time can be strengthened.

## 9. Maintenance

When code or routes change, update this file together with:

- `system-tracker/CENTRAL_UPDATE_PROMPT.md`
- `system-tracker/MARKDOWN_REGISTRY.md`
- `system-tracker/docs-updates/daily-doc-updates.md`

This keeps architecture knowledge, docs, and tracker automation aligned.
