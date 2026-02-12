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
