# Data Management Guide

## 🗑️ Clearing All Data

To remove all existing data from the database, run:

```bash
npm run clear-data
```

This script will delete all data from the following tables in the correct order:
1. **CustomerPointLedger** - Customer loyalty points history
2. **SaleItems** - Individual items in sales transactions
3. **Sales** - Sales transactions
4. **Customers** - Customer records
5. **Products** - Product inventory
6. **Categories** - Product categories
7. **Shifts** - Staff shift records
8. **Staff** - Staff/user accounts (including Super Admin)
9. **AppConfig** - Application configuration
10. **SubscriptionPlans** - Subscription plan definitions

### ⚠️ Warning
**This operation is irreversible!** All data will be permanently deleted from the database.

---

## 🌱 Re-seeding Essential Data

After clearing data, you'll need to re-create the Super Admin account and default subscription plan:

```bash
npm run seed
```

This will create:
- **Super Admin Account**
  - Username: `SuperAdmin`
  - Password: `admin123`
  - Role: `super_admin`

- **Premium Subscription Plan**
  - Name: Premium
  - Price: $99.99
  - Duration: 30 days
  - Features: Reporting, Inventory Management, Customer CRM, Multi-User Support

- **App Configuration**
  - Links the app to the Premium plan
  - Sets subscription status to "active"

---

## 🔄 Complete Reset Workflow

To completely reset the database to a fresh state:

```bash
# Step 1: Clear all existing data
npm run clear-data

# Step 2: Re-seed essential data
npm run seed
```

After this, you can log in with:
- **Username**: `SuperAdmin`
- **Password**: `admin123`

> **Security Note**: Change the default password immediately after logging in!

---

## 📊 What Gets Deleted

### Business Data
- All sales transactions and their items
- All customer records and loyalty points
- All products and categories
- All staff shift records

### System Data
- All staff accounts (including admins)
- Subscription plans
- Application configuration

### What Survives
- Database schema (tables and structure)
- Migrations history

---

## 🛠️ Manual Database Operations

If you need to perform more advanced operations:

### Access Prisma Studio (Database GUI)
```bash
npx prisma studio
```

### Reset Database (Drops and recreates all tables)
```bash
npx prisma migrate reset
```
> ⚠️ This will delete ALL data and re-run migrations

### View Database File
The SQLite database is located at:
```
prisma/dev.db
```

You can open it with any SQLite browser tool.

---

## 🔍 Verification

After clearing data, you can verify the database is empty by:

1. **Using Prisma Studio**:
   ```bash
   npx prisma studio
   ```
   Then check each table in the web interface.

2. **Checking the database file size**:
   ```bash
   dir prisma\dev.db
   ```
   The file should be much smaller after clearing data.

3. **Trying to log in**:
   - Before seeding: Login should fail (no accounts exist)
   - After seeding: Login with `SuperAdmin` / `admin123` should work

---

## 📝 Common Scenarios

### Starting Fresh for Development
```bash
npm run clear-data && npm run seed
```

### Testing with Clean Data
```bash
npm run clear-data
# Add your test data here
```

### Production Database Reset
```bash
# ⚠️ NEVER do this on production without a backup!
npm run clear-data
npm run seed
# Then manually create production accounts with secure passwords
```

---

## 🔐 Security Best Practices

1. **Change Default Passwords**: Always change `admin123` after seeding
2. **Backup Before Clearing**: Export important data before running clear-data
3. **Restrict Access**: Only authorized personnel should run these commands
4. **Production Safety**: Consider adding confirmation prompts for production environments

---

## 📞 Support

If you encounter issues:
1. Check that the database file exists: `prisma/dev.db`
2. Ensure Prisma Client is generated: `npx prisma generate`
3. Verify migrations are up to date: `npx prisma migrate status`
