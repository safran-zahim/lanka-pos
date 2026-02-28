# Lanka POS — Feature Reference

> **Stack:** Express + Prisma (SQLite) · React + Vite + Tailwind · TypeScript end-to-end
> **Last Updated:** 2026-02-28 (Phase 13)

---

## 1. Authentication & Users

| Feature | Detail |
|---|---|
| Login | Username + password via `/auth/login` — JWT token issued |
| Password Security | bcrypt (12 rounds) — plain-text auto-upgraded on first login |
| Rate Limiting | Max 10 login attempts per IP per 15 minutes |
| Roles | `super_admin`, `admin`, `manager`, `cashier` |
| Staff CRUD | Create / Edit / Delete / View staff via `/admin/users` |
| Password Reset | Admin can reset any staff password (hashed on save) |
| Session | JWT stored in localStorage, expires based on configured TTL |

---

## 2. Point-of-Sale (POS)

| Feature | Detail |
|---|---|
| Cart | Add / remove / quantity-adjust products |
| Barcode Search | Search by name, SKU, or barcode scan |
| Customer Lookup | Attach customer to sale for loyalty / credit tracking |
| Payment Methods | Cash, Card, Credit, Split (Cash + Card) |
| Discounts | % or fixed amount per item OR full-bill discount modal |
| Tax | Global tax rate applied to subtotal (toggleable in Settings) |
| Round-off | Optional rounding to configured decimal places |
| Loyalty Points | Auto-earn and redeem at checkout when enabled |
| Receipt | Thermal-style receipt with WhatsApp share option |
| Over-selling | Configurable — allow or block sales that exceed stock |
| Inactive Products | Blocked from sale at checkout (server-enforced) |
| Decimal Quantities | Validated against product unit's `allowDecimal` flag |

### Register / Cash Drawer

| Feature | Detail |
|---|---|
| Open Register | Enter starting float → opens shift, clocked in (optional) |
| Live Drawer Balance | Real-time expected cash = float + sales - expenses - refunds ± petty cash |
| Close Register | Enter counted cash → diff computed, summary printed automatically |
| Register Enforcement | When `enableDailyRegister` is ON, POS locks until register is open |
| Auto-fill Float | Pre-fills starting cash with previous shift's expected closing balance |

---

## 3. Cash & Expenses Modal (POS)

Accessible via the **Cash / Wallet** button in the POS toolbar:

| Tab | Feature |
|---|---|
| **Overview** | Hero card with live drawer total · 2×2 grid (Starting Float, Cash Sales, Cash Refunds, Total Expenses) |
| **Petty Cash** | Cash IN / Cash OUT toggle · amount + description · POST `/shifts/petty-cash` |
| **Log Expense** | Amount · category dropdown · Cash / Card toggle · description · POST `/expenses` |

> Works whether or not a daily register is active (`enableDailyRegister` setting respected).

---

## 4. Products

| Feature | Detail |
|---|---|
| Product CRUD | Create / Edit / Deactivate (soft-delete) from `/admin/products` |
| SKU & Barcode | Barcode types: C128, C39, EAN13, EAN8, UPCA, UPCE |
| Categories | Hierarchical (Category → Sub-Category) via `CategoryManagerPanel` |
| Brands | Brand library management via `BrandManager` |
| Units | kg, pcs, ltr, etc — `allowDecimal` flag per unit via `UnitManager` |
| Stock | Calculated as `totalPurchased − totalSold` (grouped queries — O(1) for any catalog size) |
| Low Stock Alert | Reorder level per product — Low Stock report at `/admin/low-stock` |
| Batch History | Per-product purchase batch view with remaining stock per batch |
| Bulk Import | CSV bulk product upload via `BulkUploadModal` |
| Delete Guard | Products with sales/purchase history cannot be hard-deleted; redirected to Deactivate |

---

## 5. Purchases & Stock Management

| Feature | Detail |
|---|---|
| Create Purchase | Add products + quantities + cost/retail price → `/admin/purchases/new` |
| Supplier Link | Each purchase tied to a supplier |
| Payment Tracking | Partial / full payment on create; additional payments from purchase detail |
| Stock Update | Purchasing creates a `PurchaseItem` batch — stock recalculated from all batches |
| FIFO | When no batch specified at checkout, oldest stock batch consumed first |
| Purchase History | Full list with status (PENDING / PARTIAL / COMPLETED) at `/admin/purchases` |
| Purchase Detail | Itemized view + payment timeline at `/admin/purchases/:id` |
| Supplier Payout | Cash payments update active shift's `totalSupplierPayments` for register balance |

---

## 6. Suppliers

| Feature | Detail |
|---|---|
| Supplier CRUD | Create / Edit / Delete at `/admin/suppliers` |
| Supplier Profile | Purchase history, total spent, and outstanding balance per supplier |
| Payment History | Per-supplier payment timeline |

---

## 7. Customers & Credit

| Feature | Detail |
|---|---|
| Customer CRUD | Create / Edit from POS or admin panel |
| Customer Profile | Purchase history, loyalty points, and credit dues at `/admin/customers/:id` |
| Loyalty Points | Earn rate and redemption value configurable in Settings |
| Customer Credit | Sell on credit (deferred payment) when `enableCustomerCredit` is ON |
| Credit Payments | Log partial or full payments against credit sales |
| Credit Balance | Running `totalDue` field per customer; updated on each payment |

---

## 8. Returns & Refunds

| Feature | Detail |
|---|---|
| Return Flow | Open original sale → select items to return → process refund |
| Partial Returns | Return any combination of items from the original sale |
| Duplicate Guard | Cannot return more than originally sold per product/batch |
| Stock Restoration | Returned quantities added back to the correct batch |
| Refund Amount | Pro-rated: includes refund of tax, discount, and round-off |
| Payment Method | Refund tracked separately for Cash / Card reporting |

---

## 9. Expenses

| Feature | Detail |
|---|---|
| Log Expense | From POS modal or `/admin/expenses` page |
| Categories | Create and manage expense categories |
| Payment Method | Cash (debits active shift drawer) or Card (no drawer impact) |
| Bill Number | Unique `EXP-YYYYMMDD-XXXX` format (race-condition-safe) |
| Petty Cash | Separate IN / OUT log tied to active shift or standalone |
| View All | Filterable list (date range, category) on Expenses page |

---

## 10. Transactions Dashboard

Accessible at `/admin/transactions` — unified money flow view:

| Column | Sources |
|---|---|
| **IN** | Cash sales, card sales, customer credit payments, petty cash IN |
| **OUT** | Cash refunds, expenses, supplier payments, petty cash OUT |

Filters: Type (IN / OUT / ALL), date range, keyword search.

---

## 11. Reports

| Report | Location |
|---|---|
| Sales Report | `/admin/reports` — daily/monthly summary |
| Shift Report | Per-shift product breakdown via `getShiftReport` |
| Low Stock | `/admin/low-stock` — products at or below reorder level |
| Expenses | `/admin/expenses` — categorized expense breakdown |
| Customer History | Customer profile page |
| Supplier History | Supplier profile page |

---

## 12. Settings

All settings live at `/admin/settings`:

| Setting | Effect |
|---|---|
| `taxEnabled` | Show/hide tax on POS and receipts |
| `taxRate` | Global VAT % applied to all sales |
| `enableDailyRegister` | Enforce shift opening before any POS activity |
| `allowOverSelling` | Allow checkout when product stock is zero or negative |
| `enableCustomerCredit` | Enable credit payment method at checkout |
| `loyaltyEnabled` | Enable loyalty points earn/redeem at checkout |
| `loyaltyEarnRate` | Points earned per currency unit spent |
| `loyaltyPointValue` | Currency value of one loyalty point |
| `roundOffEnabled` | Round totals to configured decimal places |
| `roundOffDecimals` | Number of decimal places for rounding (0–4) |
| `toastEnabled` | Show/hide notification toasts globally |
| `currencySymbol` | e.g., `Rs.`, `$`, `€` |
| `currencyCode` | e.g., `LKR`, `USD` |
| `locale` | Number/date formatting locale |
| `timeZone` | Timestamp timezone for all records |
| **Branding** | Company name, logo upload |

---

## 13. Security & Performance

| Area | Implementation |
|---|---|
| Password Hashing | bcrypt (12 rounds) on all create / reset / seed operations |
| Legacy Upgrade | Plaintext passwords auto-hashed on next successful login |
| Login Rate Limit | 10 attempts / 15 min per IP via `express-rate-limit` |
| Input Validation | Zod schemas on all API endpoints |
| Auth Middleware | JWT verified on every protected route |
| Query Performance | Product list/low-stock use batch `groupBy` — constant DB queries regardless of catalog size |
| Delete Guards | Products with history return 409; soft-delete (Deactivate) recommended |
| TypeScript | Strict mode enabled; zero compile errors across server + client |

---

## 14. Receipt & Print

| Feature | Detail |
|---|---|
| Sale Receipt | Modal receipt with thermal-style layout (80mm compatible) |
| WhatsApp Share | Sends formatted text receipt via WhatsApp Web |
| Register Summary | Auto-printed on shift close — shows cash, card, credit totals + variance |
| Print Trigger | `window.print()` auto-called on shift closure |

---

## API Routes Summary

| Prefix | Resource |
|---|---|
| `/auth` | Login, get current user |
| `/products` | Products CRUD, batches, low-stock, toggle status |
| `/categories` | Category + sub-category CRUD |
| `/brands` | Brand CRUD |
| `/units` | Unit CRUD |
| `/suppliers` | Supplier CRUD + profile |
| `/purchases` | Purchase CRUD + payments |
| `/sales` | Checkout, return, sale history |
| `/customers` | Customer CRUD + history + credit payments |
| `/expenses` | Expense CRUD + categories |
| `/shifts` | Open/close register, petty cash, shift report |
| `/transactions` | Unified cashflow feed |
| `/settings` | Read / update system settings |
| `/staff` | Staff CRUD + password reset |
| `/reports` | Aggregated report endpoints |
