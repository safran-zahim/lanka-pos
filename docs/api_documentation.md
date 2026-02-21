# API Documentation

## Base URL
\`http://localhost:3000\`

## Authentication
Most endpoints require a Bearer Token.
Header: \`Authorization: Bearer <token>\`

## Supplier Management

### List Suppliers
\`GET /suppliers\`
Returns a list of all suppliers with purchase counts.

### Get Supplier Details
\`GET /suppliers/:id\`
Returns supplier details including recent purchases and aggregated stats (Total Purchased, Paid, Due).

### Create Supplier
\`POST /suppliers\`
Body:
\`\`\`json
{
  "name": "Supplier Name",
  "contactPerson": "Manager Name",
  "email": "email@example.com",
  "phone": "1234567890"
}
\`\`\`

### Record Purchase
\`POST /suppliers/:id/purchase\`
Body:
\`\`\`json
{
  "supplierId": "uuid",
  "totalAmount": 1000,
  "paidAmount": 500,
  "status": "PARTIAL",
  "date": "2023-10-27T10:00:00Z",
  "items": [
    { "productId": "uuid", "quantity": 10, "costPrice": 100 }
  ]
}
\`\`\`

## Bulk Operations

### Bulk Import Products
\`POST /bulk/products\`
Body: Array of product objects.
\`\`\`json
[
  { "name": "Apple", "price": 1.5, "stock": 100, "category": "Fruit" },
  { "name": "Banana", "price": 0.5, "stock": 200 }
]
\`\`\`

### Bulk Import Customers
\`POST /bulk/customers\`
Body: Array of customer objects.
\`\`\`json
[
  { "name": "John Doe", "phone": "555-0101" }
]
\`\`\`

## Customer Management

### Get Customer Details
\`GET /customers/:id\`
Returns customer details with:
- \`sales\`: Recent sales history.
- \`stats\`: \`totalSpent\`, \`lastVisit\`, \`pointsBalance\`.

## Product Management

### Get Product Details
\`GET /products/:id\`
Returns product details with:
- \`stats\`: \`totalSold\`, \`totalRevenue\`, \`currentMargin\`.
- \`recentSales\`: List of recent sale timestamps and quantities.

### Get Product Batches
\`GET /products/:id/batches\`
Returns purchase batches for the product with remaining stock per batch.

Response (example):
\`\`\`json
[
  {
    "batch_id": 15,
    "product_id": 11,
    "purchased_quantity": 10,
    "quantity": 4,
    "remaining_stock": 4,
    "remaining_in_stock": 4,
    "retail_price": 150,
    "created_at": "2026-02-21T09:30:00Z"
  }
]
\`\`\`

## Sales & Returns

### Checkout (Sale or Return)
\`POST /sales/checkout\`

For sales, \`quantity\` is positive. For returns, use negative \`quantity\` and include \`parent_sale_id\`.

Request (sale):
\`\`\`json
{
  "staff_id": 2,
  "customer_id": 5,
  "payment_method": "cash",
  "items": [
    { "product_id": 11, "quantity": 1, "unit_price": 150, "batch_id": 15 }
  ],
  "totals": {
    "subtotal": 150,
    "tax": 0,
    "discount": 0,
    "grand_total": 150,
    "round_off_discount": 0
  }
}
\`\`\`

Request (return):
\`\`\`json
{
  "staff_id": 2,
  "parent_sale_id": 123,
  "payment_method": "cash",
  "items": [
    { "product_id": 11, "quantity": -1, "unit_price": 150, "batch_id": 15 }
  ],
  "totals": {
    "subtotal": -150,
    "tax": 0,
    "discount": 0,
    "grand_total": -150,
    "round_off_discount": 0
  }
}
\`\`\`
