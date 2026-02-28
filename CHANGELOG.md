# Feature Updates & Bug Fixes Changelog

## [2026-02-28] - Receipt Refinements & Registration Lock System

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
