# POS System

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
> **Hybrid Database Setup**:
> - **Local Development**: Uses **SQLite** (no Docker required).
> - **CI/CD & Production**: Uses **PostgreSQL** via Docker.

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

### 2. Database Setup (Local - SQLite)

For local development, we use SQLite to avoid Docker dependencies.

```bash
# Generate Prisma Client (uses schema.prisma -> SQLite)
npx prisma generate

# Create the database and tables
npx prisma migrate dev --name init_local
```

### 3. Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
DATABASE_URL="file:./dev.db"  # SQLite for local dev
JWT_SECRET="dev_secret_key_123"
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

For detailed instructions on building the Electron desktop application (Windows .exe), please refer to [BUILD.md](./BUILD.md).

---

## ☁️ Free Hosting Guide (End-to-End)


You can host this entire system for **$0/month** using the following services:

### 1. Database: Supabase (or Neon)
**Service**: Serverless PostgreSQL
1.  Sign up at [supabase.com](https://supabase.com).
2.  Create a new Project.
3.  Go to **Project Settings** -> **Database**.
4.  Copy the **Connection String** (Mode: **Transaction**). This goes into `DATABASE_URL`.
    - Port should be `6543`.
5.  Copy the **Connection String** (Mode: **Session**). This goes into `DIRECT_URL`.
    - Port should be `5432`.
    - *Note*: You will need to add `DIRECT_URL` to your Render environment variables as well.

### 2. Backend: Render
**Service**: Web Service (Node.js)

#### Step-by-Step Configuration:

1.  **Sign up** at [render.com](https://render.com).
2.  Click **New +** → **Web Service**.
3.  **Connect Repository**: Select `safran-zahim/lanka-pos`.

4.  **Basic Settings**:
    - **Name**: `lanka-pos` (or any unique name)
    - **Language**: `Docker` (Render auto-detects this)
    - **Branch**: `main`
    - **Region**: `Oregon (US West)` (or your preferred region)
    - **Root Directory**: Leave empty (or `.`)

5.  **Instance Type**:
    - **Free**: `$0/month` (512 MB RAM, 0.1 CPU)
      - ⚠️ Free instances spin down after inactivity
    - **Starter**: `$7/month` (512 MB RAM, 0.5 CPU) - Recommended for testing
    - **Standard**: `$25/month` (2 GB RAM, 1 CPU) - Recommended for production

6.  **Environment Variables** (Click "Add Environment Variable"):
    ```
    DATABASE_URL = postgresql://postgres.gsolfnhrmdjysoscbmth:123@Lankapos@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
    DIRECT_URL = postgresql://postgres.gsolfnhrmdjysoscbmth:123@Lankapos@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
    JWT_SECRET = your_random_secret_key_here
    NODE_ENV = production
    PORT = 3000
    ```

7.  **Advanced Settings**:
    - **Docker Build Context Directory**: `.`
    - **Dockerfile Path**: `./Dockerfile`
    - **Pre-Deploy Command**: `npx prisma generate --schema=prisma/schema.postgresql.prisma && npx prisma db push --schema=prisma/schema.postgresql.prisma && npx prisma db seed`
      - *This runs migrations and seeds the SuperAdmin user*
    - **Health Check Path**: `/` (or leave default)
    - **Auto-Deploy**: `On Commit` (enabled by default)

8.  Click **Deploy web service**.

### 3. Frontend: Vercel
**Service**: Static Site Hosting
1.  Sign up at [vercel.com](https://vercel.com).
2.  **Add New Project** -> Import your GitHub repository.
3.  **Settings**:
    - **Framework Preset**: Vite
    - **Root Directory**: `client` (Click Edit to select the client folder)
    - **Build Command**: `npm run build`
    - **Output Directory**: `dist`
4.  **Environment Variables**:
    - `VITE_API_URL`: (The URL of your Render backend, e.g., `https://lanka-pos.onrender.com`)
    - *Note*: You may need to update your frontend code to use this variable instead of the proxy if deployed separately.
5.  Deploy.

---

---

## 🔐 Default Credentials
See [CREDENTIALS.md](./CREDENTIALS.md) for a list of default logins and important secrets.

## 📖 API Documentation & Project Structure
(See original README for API details)

