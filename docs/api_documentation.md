# API Documentation

**Base URL:** `http://localhost:3000`

## Authentication
Most endpoints require a Bearer Token.
Header: `Authorization: Bearer <token>`

---

## Supplier Management

### `GET /suppliers`
Returns a list of all suppliers with purchase counts.

### `GET /suppliers/:id`
Returns supplier details including purchases and stats (Total Purchased, Paid, Due).

### `POST /suppliers`
```json
{ "name": "Supplier Name", "contactPerson": "Manager", "email": "email@example.com", "phone": "1234567890" }
```

### `POST /suppliers/:id/purchase`
```json
{
  "supplierId": "uuid", "totalAmount": 1000, "paidAmount": 500, "status": "PARTIAL",
  "date": "2023-10-27T10:00:00Z",
  "items": [{ "productId": "uuid", "quantity": 10, "costPrice": 100 }]
}
```

---

## Customer Management

### `GET /customers/:id`
Returns customer details with sales history and stats (`totalSpent`, `lastVisit`, `pointsBalance`).

### `POST /customers/:id/pay`
Records a debt repayment from a customer. Automatically links to the active shift if paid in cash.
```json
{ "amount": 500, "paymentMethod": "cash" }
```

---

## Product Management

### `GET /products/:id`
Returns product details with `stats` and `recentSales`.

### `GET /products/:id/batches`
Returns purchase batches with remaining stock per batch.

---

## Bulk Operations

### `POST /bulk/products`
```json
[{ "name": "Apple", "price": 1.5, "stock": 100, "category": "Fruit" }]
```

### `POST /bulk/customers`
```json
[{ "name": "John Doe", "phone": "555-0101" }]
```

---

## Sales & Returns

### `POST /sales/checkout`
For sales, `quantity` is positive. For returns, use negative `quantity` and include `parent_sale_id`.

**Request (sale):**
```json
{
  "staff_id": 2, "customer_id": 5, "payment_method": "cash",
  "items": [{ "product_id": 11, "quantity": 1, "unit_price": 150, "batch_id": 15 }],
  "totals": { "subtotal": 150, "tax": 0, "discount": 0, "grand_total": 150, "round_off_discount": 0 }
}
```

**Request (return):**
```json
{
  "staff_id": 2, "parent_sale_id": 123, "payment_method": "cash",
  "items": [{ "product_id": 11, "quantity": -1, "unit_price": 150, "batch_id": 15 }],
  "totals": { "subtotal": -150, "tax": 0, "discount": 0, "grand_total": -150, "round_off_discount": 0 }
}
```

---

## Shift Management (Daily Register)

> Enabled by the `enableDailyRegister` setting. When enabled, a cashier must open a shift before selling.

### `POST /shifts/open`
Opens a new register shift.
```json
{ "startingCash": 5000.00 }
```

### `GET /shifts/active`
Returns the currently open shift with real-time **expected cash** calculation:
`Starting Cash + Cash Sales + Customer Payments - Refunds - Supplier Payments - Cash Expenses + Petty Cash IN - Petty Cash OUT`

### `POST /shifts/close`
Closes the active register shift. Records the `countedCash` vs. `expectedCash` variance.
```json
{ "countedCash": 25500.00, "note": "Optional variance note" }
```

### `GET /shifts/:id/report`
Returns the shift summary, plus a breakdown of products sold during that shift.

### `POST /shifts/petty-cash`
Logs manual cash drawer adjustments (e.g., making change, pulling out lunch money).
```json
{ "amount": 500, "type": "OUT", "description": "Lunch for staff" }
```
`type` is `"IN"` or `"OUT"`.

---

## Expense Management

### `GET /expenses/categories`
Returns all expense categories.

### `POST /expenses/categories`
```json
{ "name": "Utilities", "description": "Electricity and Water" }
```

### `GET /expenses`
Returns all logged expenses with categories and staff details, ordered newest first.

### `POST /expenses`
Logs a general expense. If `paymentMethod` is `"cash"` during an open shift, the shift's `totalExpenses` is automatically incremented.
```json
{
  "amount": 1000,
  "date": "2023-10-27T10:00:00Z",
  "categoryId": 1,
  "paymentMethod": "cash",
  "description": "Bought cleaning supplies"
}
```

---

## Purchase Payment (Supplier Payments)

### `POST /purchases/:id/payment`
Records a payment against a purchase. If paid in cash during an open shift, the shift's `totalSupplierPayments` is automatically incremented.
```json
{ "amount": 500, "paymentMethod": "cash" }
```

---

## Settings

### `GET /settings`
Returns all persisted system settings as a flat list of `{ key, value }` objects.

### `PUT /settings/:key`
Updates a single setting.
```json
{ "value": true }
```

Key settings:
| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `taxEnabled` | boolean | `false` | Enable sales tax |
| `taxRate` | number | `0` | Tax rate (decimal e.g. 0.08 = 8%) |
| `loyaltyEnabled` | boolean | `false` | Enable loyalty points |
| `allowOverSelling` | boolean | `false` | Allow selling out-of-stock products |
| `enableDailyRegister` | boolean | `false` | Require cashiers to open a shift before selling |
| `currencySymbol` | string | `Rs.` | Currency symbol displayed in UI |
