# POS System

This project includes both the **backend API** (Node.js, Express, TypeScript, Prisma) and the **POS web client** (Vite + React + Tailwind).

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

## 📖 API Documentation & Project Structure

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
1.  Sign up at [render.com](https://render.com).
2.  Click **New +** -> **Web Service**.
3.  Connect your GitHub repository.
4.  **Settings**:
    - **Root Directory**: `.` (leave empty or dot)
    - **Build Command**: `npm install && npx prisma generate --schema=prisma/schema.postgresql.prisma && npx prisma db seed && npm run build`
        - *Note*: We point to the Postgres schema specifically for production build!
        - *Note*: `npx prisma db seed` creates the default SuperAdmin user.
    - **Start Command**: `npm start`
5.  **Environment Variables**:
    - `DATABASE_URL`: (Paste your Transaction connection string - Port 6543)
    - `DIRECT_URL`: (Paste your Session connection string - Port 5432)
    - `JWT_SECRET`: (Generate a random string)
    - `NODE_ENV`: `production`
6.  Deploy.

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

