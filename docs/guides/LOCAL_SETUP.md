# Running Lanka POS Locally on Desktop

This guide explains how to run the entire POS system on your local Windows desktop without any cloud hosting.

## ✅ Prerequisites

1. **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
2. **Git** (optional, for cloning) - [Download](https://git-scm.com/)
3. **A code editor** (VS Code recommended) - [Download](https://code.visualstudio.com/)

## 📦 Initial Setup (One-time)

### Step 1: Install Dependencies

Open PowerShell or Command Prompt in the project folder:

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### Step 2: Setup Database (PostgreSQL)

The current local standard is PostgreSQL. You can use Docker, a local PostgreSQL service, or a hosted Postgres database (for example Supabase/Neon).

```bash
# Generate Prisma Client
npx prisma generate

# Create database and tables
npx prisma migrate dev --name init_local

# (Optional) Seed with demo data
npx prisma db seed
```

### Step 3: Configure Environment

Configure `.env` for PostgreSQL:

```env
DATABASE_URL="postgresql://<user>:<password>@<host>:5432/<db>?schema=public"
DIRECT_URL="postgresql://<user>:<password>@<host>:5432/<db>?schema=public"
JWT_SECRET="dev_secret_key_123"
PORT=3000
```

Use your own connection details before running migrations.

## 🚀 Running the Application

### Option 1: Development Mode (Recommended for testing)

**Open TWO terminal windows:**

**Terminal 1 - Backend:**
```bash
npm run dev
```
- Runs on `http://localhost:3000`
- Auto-reloads on code changes

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```
- Runs on `http://localhost:5173`
- Auto-reloads on code changes

### Option 2: Production Mode (Simulates real deployment)

**Terminal 1 - Backend:**
```bash
npm run build
npm start
```
- Runs on `http://localhost:3000`

**Terminal 2 - Frontend:**
```bash
cd client
npm run build
npm run preview
```
- Runs on `http://localhost:4173`

## 🔐 Login Credentials

The system comes with pre-seeded demo accounts (stored in browser IndexedDB):

| Role | Username | Password |
|------|----------|----------|
| **Admin** | `admin` | `admin123` |
| **Manager** | `manager` | `manager123` |
| **Cashier** | `cashier` | `cashier123` |

## 📂 Where is Data Stored?

### Backend Data (PostgreSQL)
- **Location**: Your configured PostgreSQL instance
- **Type**: PostgreSQL database
- **Backup**: Use PostgreSQL-native backup tools for your provider/environment

### Frontend Data (IndexedDB)
- **Location**: Browser storage (Chrome/Edge)
- **Access**: Press `F12` → Application → IndexedDB → `pos-db`
- **Backup**: Use browser export tools or the app's backup feature

## 🔄 Daily Usage

### Starting the System

1. Open project folder
2. Run backend: `npm run dev`
3. Open new terminal
4. Run frontend: `cd client && npm run dev`
5. Open browser: `http://localhost:5173`

### Stopping the System

- Press `Ctrl + C` in both terminal windows

## 🛠️ Troubleshooting

### Port Already in Use

If you see "Port 3000 is already in use":

```bash
# Windows - Find and kill process
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F
```

### Database Issues

Reset the database:

```bash
# Recreate schema
npx prisma migrate dev --name init_local
npx prisma db seed
```

If you are using Docker, you can also recreate the Postgres container and re-run migrations.

### Frontend Not Loading

Clear browser cache:
- Press `Ctrl + Shift + Delete`
- Clear "Cached images and files"
- Reload page

## 📊 Accessing the System

Once running, open your browser to:

- **POS Interface**: `http://localhost:5173/pos`
- **Dashboard**: `http://localhost:5173/dashboard` (admin/manager)
- **Login**: `http://localhost:5173/login`

## 💾 Backup Your Data

### Quick Backup
```bash
# Example: export a PostgreSQL dump
pg_dump "$DATABASE_URL" > lanka-pos-backup.sql
```

### Full Backup
Create a folder with:
- Database dump (for example `lanka-pos-backup.sql`)
- `.env` (configuration)
- `client/` folder (if you made UI changes)

## 🧪 Test Asset Location Rule

- Keep browser e2e tests outside the app source tree in `tools/testing/e2e/`.
- Keep Playwright config in `tools/testing/playwright.config.ts`.
- Keep documentation for test workflows under `docs/` or `system-tracker/`, not inside app source folders.

## 🔒 Security Notes

- **Local Only**: This setup is only accessible from your computer
- **Network Access**: To access from other devices on your network, you'll need to configure the Vite server
- **Production**: For real business use, consider the cloud hosting setup in `README.md`

## 📝 Next Steps

- Customize products in the dashboard
- Add your staff members
- Configure receipt settings
- Test the POS workflow
- Verify batch remaining stock in checkout for batch items
- Test a return to confirm refund receipt labels and parent sale reference

---

**Need help?** Check the main `README.md` or `../operations/CREDENTIALS.md` for more details.
