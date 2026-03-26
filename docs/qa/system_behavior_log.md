# Lanka POS System Behavior and Validation Log

This document records the explicitly tested and verified behaviors, validation rules, toast messages, and corresponding database impacts across the Lanka POS system.

## Table of Contents
1. Authentication & Middleware
2. Product & Supplier Configuration
3. Inventory & Batches
4. Customers & Accounts
5. POS Sales & Payments (Cash, Card, Credit, Split)
6. Refunds & Stock Reversions

## 1. Authentication & Middleware
*To be filled during tests...*

## 2. Product & Supplier Configuration
- **Action:** Created a new Category via the Products > Categories tab.
  - **System Response / Toast:** Success toast. Category appears in the list.
- **Action:** Attempted to add a new Product with predefined Cost Price, Retail Price, and Initial Stock.
  - **System Response / Context:** **CRITICAL UI GAP**: The "Add New Product" modal is completely missing fields for "Cost Price", "Retail Price", and "Initial Stock". Only "Alert Quantity" and "Manage Stock" toggle are present.
  - **Toast:** Despite missing pricing fields, clicking save yields a green success toast: "Product added successfully!"

## 3. Inventory & Batches
*To be filled during tests...*

## 4. Customers & Accounts
*To be filled during tests...*

## 5. POS Sales & Payments
- **Action:** Searched effectively by Barcode and SKU. Pressing "Enter" does not add item to cart directly.
  - **System Response:** Filtering works, but UX requires manual click on the product card.
- **Action:** Added an out-of-stock product to the cart.
  - **System Response / Toast:** Displayed red error toast: "Product out of stock".
- **Action:** Initiated Checkout with Split Payment (Cash: 100, Card: 100, Credit: 120).
  - **System Response / UI:** Split payment validation correctly prevented submission until amount matched total. The UI successfully distributed the fields.
- **Action:** Clicked "COMPLETE SALE" after entering split payments.
  - **System Response / Error:** The UI got stuck in a "PROCESSING..." state prior to our fix. The fetch request `POST /sales/checkout` returned **404 Not Found**, masking a Prisma `Transaction timeout` error due to long query aggregations.
  - **Resolution / Final Result:** Increased Prisma transaction timeouts. The sale now completes successfully!
- **Action:** Sale Completion & Receipt Generation
  - **System Response / UI:** A green "Success!" / "Payment successful!" toast appears briefly.
  - **Receipt Rendering:** A modal appears with the `TapLanka POS` header, date, customer name, line items, and accurate Split break-down (Cash Portion, Card Portion, Credit Portion). Buttons to Print and WhatsApp are functional.

## 6. Refunds & Stock Reversions
- **Action:** Initiated a partial refund for "Subagent Test Product".
  - **System Response / Tooling:** The UI correctly blocked attempting to return more than purchased. Displayed warning: "Cash refund is capped at Rs. ...".
- **Action:** Completed the refund process.
  - **System Response / UI:** Green toast: "Return processed successfully". A Return Receipt (e.g., R-#7) was correctly generated mapping to the original Sale.
  - **Identified Bug:** Initially, processing a return *decreased* the global stock of the item instead of increasing it. The backend saved the return with a negated negative quantity (resulting in a positive sale deduction).
  - **Resolution / Final Result:** Removed the double negation logic in `sales.controller.ts`. Re-tested and verified that returning 1 unit properly incremented the product's "In Stock" quantity from 53 to 54.

## 7. Settings & Configuration
- **Action:** Saved updates in `SettingsPage.tsx` and `BrandingPage.tsx`.
  - **System Response / UI:** In previous states, saving `BrandingPage` details caused silent failures (no toast messages) and reverted "Company Name" to "TapLanka POS" due to a React functional state update bug firing API calls immediately. General settings were missing toast confirmations.
  - **Resolution / Final Result:** Fixed React state hook passing in `SettingsPage.tsx`, added success/error toasts to `BrandingPage.tsx`, and verified the POS receipt dynamically uses the exact Branding Configuration.
- **Action:** Rapidly clicked "Save Changes" in the `AddProductModal.tsx`.
  - **System Response / Bug:** Fired simultaneous parallel `POST/PATCH` calls resulting in excessive redundant "Product updated successfully" toasts.
  - **Resolution / Final Result:** Enforced an `isSubmitting` local state to disable the save button and throttle repeat clicks.
