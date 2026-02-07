# POS System

This project includes both the **backend API** (Node.js, Express, TypeScript, Prisma/SQLite) and the **POS web client** (Vite + React + Tailwind). It provides authentication, staff management, product inventory, sales processing, and customer CRM.

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js)

### 1. Installation

Clone the repository (if applicable) or navigate to the project directory and install dependencies:

```bash
cd c:\lanka pos
npm install

# install client dependencies
cd client
npm install
```

### 2. Database Setup

The project uses SQLite with Prisma. You need to run the migrations to create the database file (`dev.db`) and the necessary tables.

```bash
# Generate Prisma Client
npx prisma generate

# create the database and tables
npx prisma db push
```

### 3. Environment Variables (Optional)

You can create a `.env` file in the root directory to customize the configuration. If not provided, defaults will be used.

```env
PORT=3000
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-key"
```

---

## 🏃 Running the Application

### Backend (API)
Runs the server with hot-reloading using `nodemon`.

```bash
npm run dev
```
The server will start at `http://localhost:3000`.

### Frontend (POS Client)
Runs the Vite dev server.

```bash
cd client
npm run dev
```
The client will start at the URL shown in the terminal (usually `http://localhost:5173`).

### Production Build
Builds the backend TypeScript code to JavaScript and runs it.

```bash
npm run build
npm start
```

---

## ✅ Verification & Testing

This project includes an automated verification script that tests the entire end-to-end flow (Login -> Create Product -> Create Customer -> Checkout -> Verify Stock).

To run the verification script:

```bash
# Make sure the project is built first
npm run build

# Run the verification script
node dist/verify.js
```

---

## 📖 API Documentation

### 1. Authentication & Staff
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Login and receive JWT token. | No |
| `GET` | `/staff/performance` | Get sales stats for a staff member. | Yes (Manager+) |
| `POST` | `/staff/clock-in` | Record start of shift. | Yes |

### 2. Products
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/products` | List all products (supports `?search=` and `?category=`). | Yes |
| `POST` | `/products` | Create a new product. | Yes (Admin) |
| `PATCH` | `/products/:id` | Update product details. | Yes (Manager+) |
| `GET` | `/products/low-stock` | Get items below min stock level. | Yes (Manager+) |

### 3. Sales & Checkout
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/sales/checkout` | Process a sale (atomic transaction). | Yes (Cashier+) |
| `GET` | `/sales/:id` | Get sale details. | Yes |
| `POST` | `/sales/:id/refund` | Void a sale and restore stock. | Yes (Manager+) |
| `GET` | `/sales/daily-summary`| Get today's total sales. | Yes (Manager+) |

**Checkout Payload (summary):**
- `items`: `product_id`, `quantity`, `unit_price`
- `totals`: `subtotal`, `tax`, `discount`, `grand_total`, `round_off_discount`
- `loyalty` (optional): `points_earned`, `points_redeemed`

### 4. Customers
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/customers` | Search customers (`?search=`). | Yes (Cashier+) |
| `POST` | `/customers` | Create a new customer. | Yes (Cashier+) |
| `GET` | `/customers/:id` | Get customer details (profile). | Yes (Cashier+) |
| `PATCH` | `/customers/:id` | Update customer details. | Yes (Manager+) |
| `DELETE` | `/customers/:id` | Delete customer. | Yes (Manager+) |
| `GET` | `/customers/:id/points` | Get customer points history. | Yes (Cashier+) |
| `GET` | `/customers/:id/history`| Get customer purchase history. | Yes (Cashier+) |

---

## 📂 Project Structure

- `src/app.ts`: Application entry point and middleware configuration.
- `src/controllers/`: Logic for handling API requests.
- `src/routes/`: API route definitions.
- `src/middleware/`: Authentication and authorization middleware.
- `src/utils/`: Helper utilities (Prisma client, JWT).
- `prisma/schema.prisma`: Database schema definition.

---

## 🧱 Architecture Guide

### 1) Client (Offline‑first)
- **State**: Zustand stores in [client/src/store](client/src/store).
- **Local DB**: Dexie (IndexedDB) in [client/src/db/db.ts](client/src/db/db.ts).
- **Views**: Pages in [client/src/pages](client/src/pages) and components in [client/src/components](client/src/components).
- **Flow**:
  - POS and Admin UIs read/write to Dexie for fast local operations.
  - Reports, purchases, and history aggregate from Dexie.

### 2) Server (API)
- **Express + Prisma** in [src](src) with SQLite backing.
- Used for authentication and server‑side operations (see API docs above).

### 3) Data Domains
- **Products**: Inventory items with stock and pricing.
- **Purchases**: Stock‑in logs. Each line saves bill‑level fields for grouped history.
- **Transactions**: Sales/returns; line items stored separately.
- **Customers**: Profiles + points history.

### 4) Pricing Batches (Manual Selection)
- New stock creates **batches** with their own retail price.
- POS lets the cashier choose the batch/price when multiple batches exist.

---

## 🧭 Naming Conventions

- **Components**: PascalCase, one component per file.
- **Pages**: PascalCase, under [client/src/pages](client/src/pages).
- **Hooks**: `useX` (e.g., `useCurrency`).
- **Stores**: `useXStore` (e.g., `useSettingsStore`).
- **DB Tables/Models**: snake_case in data (e.g., `transaction_items`).
- **Props**: `onX` for callbacks (e.g., `onClose`, `onConfirm`).

---

## 🔧 Optimization Suggestions

1) **Currency Formatting**
	- Centralize display using [client/src/hooks/useCurrency.ts](client/src/hooks/useCurrency.ts).

2) **Dexie Indexing**
	- Add indexes for frequent filters (e.g., `status`, `timestamp`, `customer_id`).

3) **Large Lists**
	- Use list virtualization for long tables (transactions/products).

4) **Batch Pricing UX**
	- Add a quick default rule (FIFO/LIFO) if manual selection is slow for cashiers.

5) **Reports Performance**
	- Cache aggregates (daily/weekly/monthly) if dataset grows.

6) **Consistency**
	- Prefer shared UI helpers for money, date formatting, and status badges.

