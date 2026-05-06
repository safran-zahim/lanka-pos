# Lanka POS

Full-stack retail point-of-sale and inventory management system with a backend API and a modern web client.

## Portfolio Summary

- **Title:** Lanka POS
- **Description:** A full-stack point-of-sale platform for retail operations, including product and inventory management, batch-based stock tracking, daily register and cash drawer control, expense management, credit sales, supplier payments, and sales reporting.
- **Tech Stack:** Node.js, Express, TypeScript, Prisma, PostgreSQL, React, Vite, Tailwind CSS, Electron, Docker

This project includes both the **backend API** (Node.js, Express, TypeScript, Prisma) and the **POS web client** (Vite + React + Tailwind).

## ⭐ Features

- Product management with category/subcategory and auto-generated SKU
- Active/inactive product status with audit-safe toggle
- Inactive products hidden from purchase and sales workflows
- Decimal quantity support with unit-based validation
- Product history dashboard with stock, batches, and performance stats
- Low-stock alerts and reorder thresholds
- Batch-based inventory with per-batch stock tracking and selection
- Batch-aware returns with parent sale references
- Daily sales summary on the dashboard
- Refund receipts labeled with original sale references
- **Daily Register System** — Cashier shift management with cash float tracking
- **Petty Cash** — In/Out drawer adjustments linked to a shift, included in balance math
- **Expense Management** — Log general expenses by category, with auto-deduction from active shift
- **Credit Sales Tracking** — Track partial and full payments per-bill for customer debt
- **Supplier Payment Tracking** — Log supplier payments, auto-deducted from active shift cash

## 🆕 Recent Updates (Feb 27, 2026)

### Unified Daily Register & Cash Drawer
- **Register Manager** — Blocks the POS screen until a cashier opens a shift with a starting float (opt-in via Settings)
- **Active Register Modal** — Live drawer view with full cash flow breakdown:
  - Cash Sales (+), Customer Debt Payments (+), Petty Cash IN (+)
  - Refunds (−), Supplier Payments (−), General Expenses (−), Petty Cash OUT (−)
  - = **Expected Drawer Cash**
- **Close Register** — Enter physical cash count, system shows variance (Surplus/Shortage)
- **Petty Cash** — Log ad-hoc drawer adjustments (e.g., making change, staff lunch) with description

### Expense Management
- New **Expenses** page at `/admin/expenses` accessible from sidebar
- Create expense categories (Utilities, Supplies, Maintenance, etc.)
- Log expenses with amount, date, category, payment method, and description
- Cash expenses automatically deduct from the active shift's total

### Settings
- New **Enable Daily Register** toggle in Settings → General & Tax
- Off by default (fully opt-in)
- When enabled: shifts must be opened before POS use, Cash Drawer button appears

### Other
- API Documentation (`docs/api_documentation.md`) fully updated and restructured
- Fixed `clockIn` function to use updated `startingCash` field
- Prisma schema updated with `PettyCash`, `ExpenseCategory`, `Shift` models

## 🆕 Recent Updates (Feb 21, 2026)

- Batch stock now updates in real time in the cart and during checkout
- Checkout validates batch stock before submitting payment
- Return receipts show refund labels and original sale references


## 🚀 Getting Started

> [!IMPORTANT]
> **Database Setup (Current Standard)**:
> - **Local Development**: Uses **PostgreSQL**.
> - **CI/CD & Production**: Uses **PostgreSQL**.

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js)
- **Docker** (Optional: Only required if you want to run Postgres locally or build images)

### 1. Installation

Clone the repository and install dependencies:

```bash
# Install backend dependencies
npm install

# Install client dependencies
cd client
npm install
```

### 2. Database Setup (Local - PostgreSQL)

For local development, use PostgreSQL (local service, Docker, or hosted Postgres in `.env`).

```bash
# Generate Prisma Client
npx prisma generate

# Create the database and tables
npx prisma migrate dev --name init_local
```

### 3. Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
DATABASE_URL="postgresql://<user>:<password>@<host>:5432/<db>?schema=public"
DIRECT_URL="postgresql://<user>:<password>@<host>:5432/<db>?schema=public"
JWT_SECRET="dev_secret_key_123"
```

If you use Supabase or Neon, use the provider connection URLs for `DATABASE_URL` and `DIRECT_URL`.

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
The client will start at `http://localhost:5173`.

---

## 🚀 Running the System (One-Click)

On Windows, you can use the startup script to launch both backend and frontend:

```bash
./start-pos.bat
```

This will start both servers in **Development Mode** and provide logs in the root directory.

---

## 🗄️ Data Management

### Check Database Status
View the current state of your database:

```bash
npm run check-data
```

This shows the count of records in all tables.

### Clear All Data
Remove all existing data from the database:

```bash
npm run clear-data
```

⚠️ **Warning**: This permanently deletes all data including:
- Sales transactions
- Customers and loyalty points
- Products and categories
- Staff accounts
- Subscription plans

### Selective Data Cleanup (Recommended for Demos)
Remove transactions and master data but **keep** login credentials:

```bash
npm run cleanup-dummy
```

This is ideal for resetting a demo system while keeping your administrative access.

### Re-seed Essential Data
After clearing data, create the Super Admin account:

```bash
npm run seed
```

This creates:
- Super Admin (username: `SuperAdmin`, password: `admin123`)
- Premium subscription plan
- App configuration

### Interactive Reset (Recommended)
The easiest way to reset everything:

```bash
npm run reset-db
```

This single command will:
- Ask for confirmation
- Clear all data
- Re-seed Super Admin and subscription plan
- Show you the login credentials

📖 **For detailed data management instructions**, see [DATA_MANAGEMENT.md](./DATA_MANAGEMENT.md)

---

## 🏗️ CI/CD & Production

The project is configured with **GitHub Actions** for CI/CD.

### CI Pipeline (`.github/workflows/ci.yml`)
- Triggers on push/PR to `main`.
- Sets up a **PostgreSQL** service container.
- Swaps the Prisma schema to `prisma/schema.postgresql.prisma`.
- Runs migrations and tests against Postgres to ensure production compatibility.

### CD Pipeline (`.github/workflows/cd.yml`)
- Triggers on push to `main`.
- Builds Docker images for Backend and Frontend.
- Pushes to Docker Hub (requires `DOCKER_USERNAME` and `DOCKER_PASSWORD` secrets in GitHub).

### Production Build (Docker)
To build production images locally:

```bash
# Backend
docker build . -t pos-backend

# Frontend
docker build ./client -t pos-frontend
```

---

## 📖 API Documentation

The full API reference is in [`docs/api_documentation.md`](./docs/api_documentation.md), covering:
- Authentication
- Shift Management (Daily Register, Petty Cash)
- Expense Management
- Sales & Returns
- Customer & Supplier Management
- Product Management
- Settings (with all available keys)

---


## 📦 Building the Desktop Application

For detailed instructions on building the Electron desktop application (Windows .exe), please refer to [docs/guides/BUILD.md](./docs/guides/BUILD.md).

For the full centralized documentation layout, see [docs/README.md](./docs/README.md).

---

## ☁️ Free Hosting Guide (End-to-End)


You can host this entire system for **$0/month** using the following services:

### 1. Database: Supabase (or Neon)
**Service**: Serverless PostgreSQL
1.  Sign up at [supabase.com](https://supabase.com).
2.  Create a new Project.
3.  Go to **Project Settings** -> **Database**.
4.  Copy the **Connection String** (Mode: **Transaction**) and put it into `DATABASE_URL`. (Ensure it has `?pgbouncer=true`).
5.  Copy the **Connection String** (Mode: **Session**) and put it into `DIRECT_URL`.

### 2. Backend API: Render
**Service**: Web Service (Node.js)

1.  **Sign up** at [render.com](https://render.com).
2.  Create a **New Web Service** linked to your GitHub repository.
3.  **Settings**:
    - **Language**: Docker (or Node if you aren't using the Dockerfile)
    - **Build Command**: `npm run render-build`
    - **Start Command**: `npm run render-start`
    - **Instance Type**: Free ($0/month)
4.  **Environment Variables**:
    ```
    DATABASE_URL = [YOUR_TRANSACTION_CONNECTION_STRING]
    DIRECT_URL = [YOUR_SESSION_CONNECTION_STRING]
    JWT_SECRET = [YOUR_SECURE_RANDOM_KEY]
    NODE_ENV = production
    PORT = 10000
    ```
5.  Click **Deploy**. Free instances spin down after inactivity, so the first request takes ~50s to wake up!

### 3. Frontend App: Vercel
**Service**: Static Site Hosting (React/Vite)
1.  Sign up at [vercel.com](https://vercel.com) and import your repository.
2.  **Settings**:
    - **Framework Preset**: Vite
    - **Root Directory**: `client`
    - **Build Command**: `npm run build`
3.  **Environment Variables**:
    - `VITE_API_URL`: Your exact Render URL (e.g., `https://lanka-pos.onrender.com`)
4.  Deploy.

### 🚀 Initial Setup (Seeding the Database)
Once your database is online, open your **local VS Code terminal** and run:
`npm run seed`
This securely connects to Supabase and automatically creates the `superadmin`, `admin`, `manager`, and `cashier` accounts so you can log in immediately on your live Vercel site!

---

---

## 🔐 Default Credentials
See [docs/operations/CREDENTIALS.md](./docs/operations/CREDENTIALS.md) for a list of default logins and important secrets.

---

## 🗺️ Project Documentation & Knowledge Base

For a centralized view of all architectural designs, operational logs, and verification protocols, see the **[Master Knowledge Index](./docs/MASTER_INDEX.md)**.

### Folder Structure Overview
- **`client/`**: React/Vite frontend source code.
- **`src/`**: Node.js/Express backend source code.
- **`docs/`**: Project-wide architectural and design documentation.
- **`system-tracker/`**: Operational excellence logs, daily updates, and development history.
- **`prisma/`**: Database schema and migration files.
- **`tools/`**: Helper scripts for testing and automation.

---
*Last Updated: 2026-03-31*

