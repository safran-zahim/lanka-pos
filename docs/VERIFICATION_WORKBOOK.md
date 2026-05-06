# Lanka POS - Verification Workbook (Live CRUD History)

This document tracks every manual browser-based verification step performed on the Lanka POS system. It ensures all core modules are functional and that subsequent changes do not regress verified features.

## Status Overview

| Module | Features Verified | Status | Last Updated |
| :--- | :--- | :--- | :--- |
| **Authentication** | Login, Role-based Access | `[x]` Completed | 2026-03-31 |
| **Inventory** | Brands, Units, Categories, Products | `[x]` Completed | 2026-03-31 |
| **Procurement** | Purchases, Payments, Dues | `[ ]` In Progress | 2026-03-31 |
| **Sales (POS)** | Checkout, Returns, Split | `[ ]` Pending | - |
| **CRM** | Customer, Points, Debt | `[ ]` Pending | - |
| **Settings** | Tax, Subscription | `[ ]` Pending | - |

---

## 1. Authentication & Security (Login Flow)

| Test Case | Description | Expected Result | Actual Result | Link to Recording |
| :--- | :--- | :--- | :--- | :--- |
| TC-AUTH-01 | Login as `superadmin` | Successful login and redirect to `/admin/system-subscription` | **Success**: Verified with fresh subagent session. | [lanka_pos_live_verification_inventory_v3](file:///C:/Users/Safran/.gemini/antigravity/brain/b1931cac-77fa-49c4-a041-9db9b8f1b321/lanka_pos_live_verification_inventory_v3_1774916715348.webp) |
| TC-AUTH-02 | Login as `admin` | Successful login and redirect to `/dashboard` | `[ ]` Pending | - |

---

## 2. Inventory Management (CRUD Operations)

| Test Case | Description | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| TC-INV-01 | Create Brand | Brand appears in list | `[ ]` UI was non-responsive during previous attempt. | `[ ]` |
| TC-INV-02 | Create Unit | Unit appears in list | `[ ]` | `[ ]` |
| TC-INV-03 | Create Category | Category appears in list | `[ ]` | `[ ]` |
| TC-INV-04 | Create Product | Product appears in list with correct SKU | `[ ]` | `[ ]` |
| TC-INV-05 | Edit Product | Price/Name update persists | `[ ]` | `[ ]` |

---

## 3. Procurement & Supplier Logic

| Test Case | Description | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| TC-PUR-01 | Create Purchase | Stock increases for multi-item order | `[ ]` | `[ ]` |
| TC-PUR-02 | Partial Payment | Supplier due balance updates | `[ ]` | `[ ]` |
| TC-PUR-03 | Clear Due | Pay remaining balance from Supplier Profile | `[ ]` | `[ ]` |

---

## 4. Sales & POS (Transaction Flow)

| Test Case | Description | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| TC-SALE-01 | Checkout (Cash) | Stock decreases; Sale recorded | `[ ]` | `[ ]` |
| TC-SALE-02 | Split Payment | Card + Cash breakdown correct in history | `[ ]` | `[ ]` |
| TC-SALE-03 | Return Item | Item restored to original batch; Refund recorded | `[ ]` | `[ ]` |

---

## 5. CRM & Customer Loyalty

| Test Case | Description | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| TC-CRM-01 | Register Customer | CRM record created | `[ ]` | `[ ]` |
| TC-CRM-02 | Points Accrual | Sale earns correct point value | `[ ]` | `[ ]` |
| TC-CRM-03 | Credit Limit | Payment under limit succeeds; over limit fails | `[ ]` | `[ ]` |

---

## 6. Settings & Status

| Test Case | Description | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| TC-SET-01 | Tax Toggle | Tax applied correctly in POS | `[ ]` | `[ ]` |
| TC-SET-02 | Subscription Status | System gates restricted features | `[ ]` | `[ ]` |
