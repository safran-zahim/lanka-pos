# Feature Updates & Bug Fixes Changelog

## [2026-03-27] - Audit Traceability Matrix & UI Consistency (Phase 3)

### 🛡️ Extended Audit Coverage
- **Staff Module**: All critical staff lifecycle mutations are now audit-logged atomically:
  - `CREATE_STAFF` — tracks actor, new name/role.
  - `UPDATE_STAFF` — captures before/after name, role, and hourly rate snapshots.
  - `DELETE_STAFF` — records the deleted staff name and role.
  - `RESET_STAFF_PASSWORD` — records who reset which user's password (no plaintext logged).
- **Customer Module**: Critical customer mutations are now audit-logged atomically:
  - `CREATE_CUSTOMER` — tracks actor, phone/email.
  - `UPDATE_CUSTOMER` — captures before/after contact info snapshots.
  - `DELETE_CUSTOMER` — records the deleted customer's name and phone.

### 🎨 ShadCN UI Consistency
- **Notification Center**: Refactored from raw HTML/Tailwind to `Card`, `Button (ghost/primary)`, and `Badge (destructive)` shadcn primitives. All `dark:gray-*` color classes replaced with CSS variable tokens for full theme compatibility.
- **Reconciliation Tab**: Refactored period mode selector from raw `<button>` to `<Button variant="primary/ghost">`, variance label from div to `<Badge variant="destructive/default">`, and outer container to `<Card>`.


### 🛡️ Audit Logging System (Traceability)
- **Centralized Auditing**: Implemented a robust `AuditLog` framework with a dedicated Prisma model and a reusable `logAudit` utility.
- **Controller Instrumentation**: Instrumented `Product` (price changes, status toggles) and `Settings` (global config) controllers with atomic audit logging, ensuring all critical mutations are attributed to the performing staff member.
- **Historical Snapshots**: Audit logs capture before/after JSON snapshots of resource states for simplified forensic analysis.

### 💵 Financial Accountability (Shift Reconciliation)
- **Reconciliation Dashboard**: Added a new "Reconciliation" tab to the Reports section, allowing managers to audit cash variances across all closed shifts.
- **Variance Logic**: Implemented backend aggregation to calculate Overage/Shortage based on `expectedCash` vs. `countedCash`.
- **Note Integration**: Shift closing notes are now surfaced in the reconciliation view for quick context on discrepancies.

### 🔔 Proactive Management (Notification Center)
- **Admin & POS Notification Hub**: Developed a global notification center with unread badges, multi-type alerts (Info, Warning, Error), and organized history.
- **Smart Stock Monitor**: Integrated a background `useStockMonitor` hook that proactively polls inventory health and triggers automated notifications when products drop below reorder levels.
- **Zustand Store**: Implemented `useNotificationStore` for persistent, application-wide alert state management.

### 📁 Documentation & Knowledge Base
- Created `OPERATIONAL_EXCELLENCE_PHASE_2.md` documenting the audit and reconciliation architecture.
- Updated `MARKDOWN_REGISTRY.md` and central system analysis reports.


## [2026-03-27] - Dashboard BI v2 & UI Refinements

### 💹 Advanced Business Intelligence (Dashboard v2)
- **Multi-Dimensional Metrics**: Improved the `reports.controller.ts` to track **Top Performers** (Aggregated by revenue and quantity over 30 days), **Brand Mix Distribution**, and **Slow-Moving Inventory** alerts.
- **Premium UI Overhaul**: Refactored the Dashboard header into stylized, gradient-based summary cards for **Revenue**, **Profit**, **ATV**, **Inventory Value**, and **Stock Health**, aligning the core dashboard aesthetic with the professional Reports page.
- **Inventory Velocity Widgets**: Added interactive visualizations for market share by brand and actionable alerts for zero-sales stock identification.

### 🔔 Operations & Stability
- **Dynamic Sidebar Badges**: Integrated a real-time "Low Stock" badge into the sidebar menu to alert managers of items requiring reordering at all times.
- **Checkout Optimization (High Load)**: Refactored the `checkout` transaction in `sales.controller.ts` to use bulk data fetching and grouped aggregations. This resolves Prisma transaction timeouts when selling large carts with items from multiple batches.
- **Persistent shift/Subscription visibility**: Standardized headers across POS and Admin layouts to ensure constant visibility of shift status and subscription validity.

### 📁 Documentation
- Created `DASHBOARD_INTELLIGENCE_SYSTEM.md` specialized knowledge base file.
- Updated central `Workspace Architecture Analysis` and `Markdown Registry`.

## [2026-03-26] - Dashboard Overhaul & Business Intelligence

### 📊 New: High-Density Business Intelligence Dashboard
- **"The Pulse" Insight Bar**: Real-time header metrics for **Today's Revenue**, **Net Profit**, **Average Transaction Value (ATV)**, and **Stock Health Status**.
- **Sales Heatmap**: Hourly traffic visualization using `Chart.js` line charts to identify peak operational hours.
- **Product Intelligence**: Doughnut charts displaying category sales distribution and top-selling item logic.
- **CRM Insights**: Bar charts comparing New vs. Returning customers to measure business loyalty.
- **Backend Reporting Service**: Centralized `reports.controller.ts` providing optimized metrics aggregation for real-time dashboard updates.

## [2026-03-26] - Developer & Subscription Control System

### 🔐 New: Subscription Enforcement (Login Gating)
- **Login Block for Expired Subscriptions**: Non-`super_admin` users are now blocked at login if the subscription is expired, blocked, or the system is manually disabled. Returns HTTP 403 with `code: SUBSCRIPTION_BLOCKED` and a descriptive message.
- **Developer Always Bypasses**: `super_admin` (developer) is **never** blocked regardless of subscription state.
- **Mid-Session Protection**: `requireActiveSubscription` middleware now enforces expiry-date checks on all protected API routes — if a session remains open past expiration, requests will fail gracefully with a 402 payment required error.

### 🗄️ Database Changes
- **`AppConfig` Model Extended**: Added `subscriptionExpiresAt` (DateTime?), `isNeverEnd` (Boolean), `isSystemDisabled` (Boolean), and `clientNote` (String?) fields.
- **New `SubscriptionHistory` Model**: Every subscription configuration change now creates a full audit log entry recording: who changed it, action type, previous/new status, previous/new expiry date, plan assignment, flags snapshot, and optional reason note.

### 🛠️ Backend Changes
- **`src/utils/appConfig.ts`**: Refactored to expose `isSubscriptionValid()` — a shared pure function that checks `isSystemDisabled`, `subscriptionStatus`, `isNeverEnd`, and `subscriptionExpiresAt`. Used by both login and middleware.
- **`src/controllers/auth.controller.ts`**: Login now gates access using `isSubscriptionValid()`. Also returns `daysRemaining` to the client for frontend warning banners.
- **`src/middleware/auth.middleware.ts`**: `requireActiveSubscription` updated to use the shared `isSubscriptionValid()` with full expiry-date awareness.
- **`src/controllers/subscription.controller.ts`**: 
  - `updateSubscriptionStatus` now accepts `subscriptionExpiresAt`, `isNeverEnd`, `isSystemDisabled`, `clientNote`, and `historyNote`. Writes a `SubscriptionHistory` record on every change.
  - New `getSubscriptionHistory` endpoint: `GET /subscription/history` (super_admin only) returns the last 100 history entries.
  - `getSubscriptionStatus` now returns `daysRemaining`, `isNeverEnd`, `isSystemDisabled`, and `clientNote`.
- **`src/routes/subscription.routes.ts`**: Added `GET /subscription/history` route. Admin/manager can now read `/subscription/status` without being blocked (read-only access removed from subscription gate).

### 🖥️ Frontend Changes
- **New Page `SystemSubscriptionPage.tsx`**: Developer-only control panel at `/admin/system-subscription`:
  - Kill-switch toggle to enable/disable the entire system for all non-developer users.
  - Subscription status dropdown (Active, Past Due, Blocked, Canceled).
  - Expiration date & time picker (disabled when Never-End is on).
  - Never-End (Lifetime) toggle — overrides expiry date.
  - Assigned Plan selector from active subscription plans.
  - Internal Client Note field (developer-only, not visible to other roles).
  - Change Reason field — logged into subscription history.
  - Expandable Subscription History log with action labels, before/after values, and timestamps.
  - Expiring-Soon warning panel if ≤7 days remaining.
- **`Login.tsx`**: Subscription-blocked errors now display a distinct UI (red banner with lock icon) with a clear message. `super_admin` now redirects to `/admin/system-subscription` on login.
- **`AdminLayout.tsx`**: Added "Subscription Control" (`/admin/system-subscription`) and "Subscription Plans" sidebar nav items for `super_admin`.
- **`POS.tsx`**: Added a dismissable subscription expiry warning banner at the top of the POS terminal — amber (7 days), orange (3 days), pulsing red (1 day). Fetches live `daysRemaining` from the API on POS load.
- **`App.tsx`**: Registered `SystemSubscriptionPage` at `/admin/system-subscription` under `super_admin`-only route guard.

### 📋 Role Permissions Clarification
- `admin` has all operational permissions (products, users, customers, sales, reports, settings, receipts) but **cannot modify subscription settings**.
- `admin` and `manager` can **view** subscription status (expiry date, plan name, status, days remaining) in read-only mode via the `/subscription/status` API.
- Subscription plan management and system enable/disable remain **super_admin exclusive**.

### 🧾 New: Receipt Customization & Professional Branding
- **Relocated Tax ID**: Moved "Tax ID / VAT Number" from Appearance settings to the "Business Information" section for better logical grouping and faster setup.
- **Multi-line Address Support**: Receipts now support "Address Line 1" and "Address Line 2" (City/State), allowing for more professional and geographically accurate headers.
- **Business Description**: Added a new field for a shorter business tagline or category (e.g., "Retail & Wholesale") that appears directly under the business name.
- **Branding Logic Overhaul**:
    - **User Footer**: The primary receipt footer now defaults to the internationally standard **"Thank you for your business!"**.
    - **Developer Footer**: Introduced a new `super_admin`-controlled toggle for developer branding ("Developed by Tap Lanka POS 0705083388"). This is positioned at the very bottom and can be enabled/disabled independently of the user's custom footer.
- **Live Preview Enhancements**: The Receipt Configuration page now reflects these new fields in real-time, allowing users to see exactly how their address lines and branding will appear before saving.



## [2026-03-26] - POS Setting & UI QA Fixes

### Bug Fixes
- **Duplicate Success Toasts (Products)**: Implemented an explicit `isSubmitting` tracking state combined with a synchronous `useRef` event lock within `AddProductModal.tsx` to completely disable the Save button and instantly reject duplicate synthetic submit events when users (or automated tools) double-click standard forms.
- **Branding State Silently Failing**: Fixed a critical React infinite-loop memory leak ("Maximum update depth exceeded") in `SettingsPage.tsx`. The `onSaveReady` handler was passing an inline execution closure causing constant re-renders. Refactored to utilize stable `useCallback` identity, resulting in `BrandingPage.tsx` successfully persisting customized company names natively to the POS Receipt headers again. Added success and error `useToast` notifications for immediate visual feedback on the branding panel.
- **Refund Logic Double Negation**: Resolved a stock-tracking bug in `sales.controller.ts` where returning an item incorrectly *decreased* available product stock due to an erroneous mathematical double-negative inside the Prisma schema update transaction. Returning items now correctly increments stock quantities.
- **POS Checkout Transaction Threshold**: Addressed frequent 404/Timeout errors during high-load split-payment checkouts by increasing backend Prisma transactional limits configurations (`maxWait` and `timeout`) natively in the checkout flow.## [2026-03-07] - Return Module Refinements

## [2026-03-07] - Comprehensive POS UX/UI Enhancements & Return Module Overhaul

### Return Module & Refund Logic
- **Complete UI Redesign (Single-View UX)**: The `ReturnModal.tsx` has been completely rebuilt. The legacy tabbed interface has been replaced with a fluid, scrollable single-page view. All relevant context—transaction info, structured payment breakdowns, internal notes, and returnable items list—is now immediately visible without clicking between tabs. 
- **Minimalist Aesthetic Integration**: Applied strict spacing rules, reduced excessive padding, and standardized layout structures to ensure the Return Modal perfectly aligns with the minimalist, modern aesthetic previously established in `UnifiedCheckoutModal` and `SalesHistoryDashboard`.
- **Backend Note Management**: Implemented a new REST endpoint (`PATCH /sales/:id/note`) and integrated full note-editing capabilities directly into the Return Modal. Staff can now document specific reasons for returns/adjustments on the original sales record seamlessly.
- **Double Refund Prevention (Critical Fix)**: Implemented robust state-checking to prevent processing refunds on bills that have already been fully returned, or inadvertently attempting to refund a "Return" transaction record. The UI now dynamically disables interactions and explicitly warns the user ("Already Refunded").
- **Pro-rated Cash Refund Capping (Fiscal Fix)**: Resolved an edge case with split payments (Cash + Credit/Card) where a strict cash refund could incorrectly exceed the initial cash tendered. The system now enforces a hard cap, ensuring cash refunds cannot exceed the original cash portion paid.
- **Batch ID Nullification Patch**: Corrected a critical payload mapping error (`item.batch_id` vs `item.batchId`) on the frontend that was causing backend 404 validation failures during legitimate refund attempts.

### Core POS & Checkout
- **Split Payment Receipt Rendering**: Fixed a critical formatting bug where split payments (ex. Cash + Card) were displaying an extraneous "00" string padding block randomly on thermal prints. Added dedicated sub-lines for each payment type to ensure transparent customer accounting.
- **Credit Balance Integrity**: Ensured that the backend properly registers and deducts `dueAmount` metrics appropriately during both partial and full split-payment refunds.
- **Unified Checkout Modal Polish**: Addressed corner-case styling issues and ensured dynamic buttons (ex. "Mark as Paid") stretch to full width for better touchscreen targeting.

### Sales History & Interface
- **Sales History Dashboard Revamp**: Overhauled the Sales History UI, introducing distinct visual badging for transaction types and payment methods. The dashboard now features a cleaner table structure with responsive summary cards.
- **Print Action Centralization**: Streamlined the layout by moving specific action buttons (like "Print Receipt") directly into modal views rather than cluttering high-level lists.

### Bulk Operations & Admin Tools
- **Product Bulk Action Refactoring**: Consolidated the generic "Actions" dropdown menu on the Products page into explicit, high-visibility "Bulk Export" and "Bulk Import" primary buttons.
- **Bulk Import Modal Standardization**: Rebuilt the Import Data modal layout to match the minimalist system aesthetic, significantly reducing padding and visual noise.

## [2026-02-28] - Security Hardening & Bug Fix Batch

### Security
- **Plaintext Passwords (BUG-01)**: Passwords now hashed with `bcrypt` (12 rounds). Existing plain-text passwords are auto-upgraded to hashed on first successful login — no manual migration needed.

### Fixed
- **Settings Boolean Casting (BUG-02)**: `enableDailyRegister` and `allowOverSelling` settings were always being read as `false` due to Prisma storing JSON `"true"` as a string. Both `shift.controller.ts` and `sales.controller.ts` now handle both `true` (boolean) and `"true"` (string) correctly.
- **Customer List Cap (BUG-07)**: Admin customer list was hard-capped at 50 records. Now returns up to 500 when no search is active, and 50 when filtering by search term.
- **Empty Purchase Submissions (BUG-09)**: Purchase creation now requires at least 1 item. A Zod `.min(1)` guard prevents zero-item purchases from reaching the database.
- **@ts-ignore Removed (BUG-08)**: The `// @ts-ignore` workaround in `addPettyCash` is removed since Prisma now accepts `shiftId: undefined` with the optional schema field.
- **Debug Console Logs Removed (BUG-10)**: Removed all development `console.log` statements from `product.controller.ts` and `sales.controller.ts` — these were leaking internal product names, batch IDs, and stock counts to server logs in production.
- **Audit Script TypeScript Error**: Fixed pre-existing `e.message` strict-mode error in `check-shadow-debt.ts`.

### Performance
- **N+1 Query Fix — Product List (BUG-04)**: `getProducts` and `getLowStock` previously ran 3 DB queries *per product* (300+ queries for 100 products). Now uses 3 batched `groupBy` queries total — constant time regardless of catalog size.
- **Remaining Debug Logs (BUG-10)**: Removed FIFO creation and over-selling `console.log` statements from `sales.controller.ts`.

### Data Integrity
- **Expense Bill Number Race Condition (BUG-03)**: Bill numbers now use `EXP-YYYYMMDD-XXXX` format (timestamp + 4-char random suffix) instead of `count() + 1`, preventing duplicate bill numbers under concurrent requests.
- **Product Delete Guard (BUG-06)**: `deleteProduct` now checks for existing sale items and purchase batches. Products with history return HTTP 409 with a message directing staff to use "Mark as Inactive" instead.


### Added
- **Transactions Dashboard (`/admin/transactions`)**: 
  - Created a unified `GET /transactions` endpoint mapping all financial events (`Sale`, `CustomerPayment`, `Expense`, `PettyCash`, `PurchasePayment`) to a cohesive ledger.
  - Implemented a dedicated mobile-responsive Money Dashboard displaying Total IN, Total OUT, and Net Cash Flow, paired with a generic dynamic transaction table.
  - Separated Sales History out of the Transactions tab into its own dedicated isolated page (`/admin/sales`).
- **Petty Cash Visibility**: 
  - Merged Petty Cash records into the primary `/admin/expenses` Dashboard.
  - Added Green identifiers for Petty Cash IN and Orange identifiers for Petty Cash OUT floats for clear separation from general business expenses.

### Changed
- **Register Summary Receipt**:
  - Inserted opening and closing shift timestamps (`startTime`, `endTime`) directly below the main header on the `RegisterSummaryReceipt.tsx` template.
  - Aligned the modal grid constraints of the Register Summary to precisely match `ReceiptModal.tsx` constraints to prevent physical printer whitespace anomalies.
- **WhatsApp Digital Receipts**:
  - Re-mapped the WhatsApp API constructor payload (`whatsappUrl`) to explicitly utilize clean Markdown formatting (`*bold*` blocks, multi-line separation), matching the visual structure of the original native thermal print directly inside web application chats.
- **Out-of-Shift Expense & Petty Cash Support**: 
  - Refactored `PettyCash` database schema (`shiftId` now optional) and backend controllers to support logging transactions even when shifts are disabled in Admin Settings.
  - Frontend now keeps the Cash panel accessible in non-register mode with null-safe balance displays.
- **POS Cash Panel → Centered Modal**:
  - Replaced the right-side sliding `POSCashPanel` sidebar with a new **centered modal dialog** (`POSCashModal.tsx`).
  - New design features: blurred backdrop overlay, metric breakdown grid (2×2 cards), pill-tab payment method toggles, press-feedback submit buttons, and full dark mode support.
  - Deleted legacy `POSCashPanel.tsx`. `POS.tsx` updated to import and render the new modal.
- **Active Register POS Lockdown**:
  - Modified POS screen rendering state explicitly tying `setShowActiveRegister(false)` and `setIsRegisterOpen(false)` sequentially upon the Register Closing action. The grid now visually locks down and halts new transactions permanently until a fresh valid cashier float is entered.

### Fixed
- **Printed Bill "00" String Bug on Split Payments**:
  - Resolved a severe string-concatenation UI parsing glitch causing certain split-paid float calculations in `SplitPaymentModal.tsx` and `ReceiptModal.tsx` to mistakenly render and visually append an extra `"00"` padding structure directly onto printed generic physical bills.
