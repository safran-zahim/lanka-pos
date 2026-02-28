# Feature Updates & Bug Fixes Changelog

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
