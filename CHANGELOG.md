# Feature Updates & Bug Fixes Changelog

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
