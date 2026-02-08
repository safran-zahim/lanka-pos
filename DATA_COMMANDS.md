# Data Management Quick Reference

## 📋 Available Commands

| Command | Description | Safe? |
|---------|-------------|-------|
| `npm run check-data` | Check database status (count records) | ✅ Yes |
| `npm run clear-data` | Delete all data from database | ⚠️ No - Destructive |
| `npm run seed` | Create Super Admin & subscription plan | ✅ Yes |
| `npm run reset-db` | Interactive reset (clear + seed) | ⚠️ No - Destructive |

---

## 🎯 Common Workflows

### 1. Check What's in the Database
```bash
npm run check-data
```
**Output:** Shows count of records in all tables

---

### 2. Complete Database Reset (Recommended)
```bash
npm run reset-db
```
**What it does:**
1. Asks for confirmation
2. Deletes all data
3. Re-creates Super Admin
4. Shows login credentials

**When to use:**
- Starting fresh for development
- Clearing test data
- Resetting to default state

---

### 3. Manual Reset (Advanced)
```bash
# Step 1: Clear all data
npm run clear-data

# Step 2: Re-seed essentials
npm run seed
```

**When to use:**
- You want more control over the process
- You want to clear without re-seeding
- You're automating the process

---

### 4. Clear Without Re-seeding
```bash
npm run clear-data
```

**When to use:**
- You want to add your own test data
- You're preparing for a fresh import
- You want a completely empty database

---

## 🔐 Default Credentials After Seeding

| Field | Value |
|-------|-------|
| **Username** | `SuperAdmin` |
| **Password** | `admin123` |
| **Role** | `super_admin` |

⚠️ **Change this password immediately in production!**

---

## 📊 What Gets Deleted

When you run `clear-data` or `reset-db`:

### Business Data ❌
- All sales transactions
- All sale items
- All customers
- All loyalty points
- All products
- All categories
- All staff shifts

### System Data ❌
- All staff accounts
- All subscription plans
- App configuration

### What Remains ✅
- Database schema (table structure)
- Migration history

---

## ⚠️ Safety Tips

1. **Always check first:**
   ```bash
   npm run check-data
   ```

2. **Use interactive reset:**
   ```bash
   npm run reset-db  # Asks for confirmation
   ```

3. **Backup important data** before clearing

4. **Never run in production** without a backup

5. **Change default passwords** after seeding

---

## 🆘 Troubleshooting

### "No data found" after clearing
✅ **This is normal!** Run `npm run seed` to create Super Admin.

### Can't log in after clearing
✅ **Expected!** Run `npm run seed` to create accounts.

### Want to undo a clear operation
❌ **Not possible!** Data is permanently deleted. Always backup first.

### Database file is missing
```bash
npx prisma migrate dev --name init
```

### Prisma Client errors
```bash
npx prisma generate
```

---

## 📚 More Information

- **Detailed Guide:** [DATA_MANAGEMENT.md](./DATA_MANAGEMENT.md)
- **Setup Instructions:** [README.md](./README.md)
- **Default Credentials:** [CREDENTIALS.md](./CREDENTIALS.md)

---

**Last Updated:** 2026-02-08
