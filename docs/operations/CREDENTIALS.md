# Default Credentials

## 🔒 Production (Backend)
These credentials work when the backend database is connected (e.g., PostgreSQL on Supabase/Neon).
**You must run the seeder first!** (See `README.md`)

- **Role**: Super Admin
  - **Username**: `SuperAdmin`
  - **Password**: `admin123`

---

## 💻 Local Development (Offline/Demo)
These accounts exist in your local browser database (IndexedDB) and work even without a backend connection.

| Role | Username | Password |
|------|----------|----------|
| **Admin** | `Admin` | `admin123` |
| **Manager** | `Manager` | `manager123` |
| **Cashier** | `Cashier` | `cashier123` |

> [!CAUTION]
> **Change these passwords immediately** after deploying to production!

---

## 🗄️ Database Secrets (Supabase)
**DO NOT COMMIT THIS FILE TO GIT IF IT CONTAINS REAL SECRETS.**

- **Database Password**: `123@Lankapos`

### Connection Strings
Use these environment variables in your Render/Vercel deployment.

#### 1. Transaction Mode (DATABASE_URL)
Use this for the main application connection (Port 6543).
**(Supabase Transaction Pooler)**
`postgresql://postgres.gsolfnhrmdjysoscbmth:123@Lankapos@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true`

> **Note**: We appended `?pgbouncer=true` because Prisma requires this flag when connecting to a transaction pooler that doesn't support prepared statements.

#### 2. Session Mode (DIRECT_URL)
Use this for migrations and direct database access (Port 5432).
**(Supabase Session Pooler - IPv4)**
`postgresql://postgres.gsolfnhrmdjysoscbmth:123@Lankapos@aws-0-ap-south-1.pooler.supabase.com:5432/postgres`

> **Why IPv4?**: Most CI/CD (like GitHub Actions) and serverless environments (like Render) use IPv4. The Session Pooler is IPv4 compatible, ensuring migrations run smoothly. The Direct Connection (IPv6) often fails in these environments.

### Public Keys (Frontend)
- **Supabase Project URL**: `https://gsolfnhrmdjysoscbmth.supabase.co`
- **Publishable Key**: `sb_publishable_DxSIlRauWZjId-1_Q2ASOQ_x3BR7gCz`
