import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query: string): Promise<string> {
    return new Promise(resolve => rl.question(query, resolve));
}

async function resetDatabase() {
    console.log('🔄 Database Reset Utility\n');
    console.log('This will:');
    console.log('  1. Delete ALL existing data');
    console.log('  2. Re-seed Super Admin account');
    console.log('  3. Re-create Premium subscription plan');
    console.log('\n⚠️  WARNING: This action is IRREVERSIBLE!\n');

    const answer = await question('Are you sure you want to continue? (yes/no): ');

    if (answer.toLowerCase() !== 'yes') {
        console.log('\n❌ Reset cancelled.');
        rl.close();
        return;
    }

    console.log('\n🗑️  Step 1: Clearing all data...\n');

    try {
        // Delete in order to respect foreign key constraints
        const pointLedger = await prisma.customerPointLedger.deleteMany({});
        console.log(`  ✓ Deleted ${pointLedger.count} point ledger entries`);

        const saleItems = await prisma.saleItem.deleteMany({});
        console.log(`  ✓ Deleted ${saleItems.count} sale items`);

        const sales = await prisma.sale.deleteMany({});
        console.log(`  ✓ Deleted ${sales.count} sales`);

        const customers = await prisma.customer.deleteMany({});
        console.log(`  ✓ Deleted ${customers.count} customers`);

        const products = await prisma.product.deleteMany({});
        console.log(`  ✓ Deleted ${products.count} products`);

        const categories = await prisma.category.deleteMany({});
        console.log(`  ✓ Deleted ${categories.count} categories`);

        const shifts = await prisma.shift.deleteMany({});
        console.log(`  ✓ Deleted ${shifts.count} shifts`);

        const staff = await prisma.staff.deleteMany({});
        console.log(`  ✓ Deleted ${staff.count} staff members`);

        const appConfig = await prisma.appConfig.deleteMany({});
        console.log(`  ✓ Deleted ${appConfig.count} app config entries`);

        const plans = await prisma.subscriptionPlan.deleteMany({});
        console.log(`  ✓ Deleted ${plans.count} subscription plans`);

        console.log('\n✅ All data cleared successfully!\n');

        console.log('🌱 Step 2: Re-seeding essential data...\n');

        // Create Plan
        const plan = await prisma.subscriptionPlan.create({
            data: {
                name: 'Premium',
                price: 99.99,
                duration: 30,
                features: JSON.stringify(['Reporting', 'Inventory Management', 'Customer CRM', 'Multi-User Support']),
                active: true
            }
        });
        console.log('  ✓ Created subscription plan: Premium');

        // Create Super Admin
        const password = 'admin123';
        await prisma.staff.create({
            data: {
                name: 'SuperAdmin',
                role: 'super_admin',
                password: password
            }
        });
        console.log('  ✓ Created Super Admin account');

        // Update AppConfig
        await prisma.appConfig.create({
            data: {
                key: 'main',
                subscriptionStatus: 'active',
                subscriptionPlanId: plan.id
            }
        });
        console.log('  ✓ Created app configuration');

        console.log('\n✅ Database reset complete!\n');
        console.log('📝 You can now log in with:');
        console.log('   Username: SuperAdmin');
        console.log('   Password: admin123\n');
        console.log('⚠️  Remember to change the default password!\n');

    } catch (error) {
        console.error('\n❌ Error during reset:', error);
        throw error;
    } finally {
        rl.close();
    }
}

resetDatabase()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
