import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearAllData() {
    console.log('🗑️  Starting data cleanup...\n');

    try {
        // Delete in order to respect foreign key constraints
        console.log('Deleting CustomerPointLedger...');
        const pointLedger = await prisma.customerPointLedger.deleteMany({});
        console.log(`✓ Deleted ${pointLedger.count} point ledger entries`);

        console.log('Deleting SaleItems...');
        const saleItems = await prisma.saleItem.deleteMany({});
        console.log(`✓ Deleted ${saleItems.count} sale items`);

        console.log('Deleting Sales...');
        const sales = await prisma.sale.deleteMany({});
        console.log(`✓ Deleted ${sales.count} sales`);

        console.log('Deleting Customers...');
        const customers = await prisma.customer.deleteMany({});
        console.log(`✓ Deleted ${customers.count} customers`);

        console.log('Deleting Products...');
        const products = await prisma.product.deleteMany({});
        console.log(`✓ Deleted ${products.count} products`);

        console.log('Deleting Categories...');
        const categories = await prisma.category.deleteMany({});
        console.log(`✓ Deleted ${categories.count} categories`);

        console.log('Deleting Shifts...');
        const shifts = await prisma.shift.deleteMany({});
        console.log(`✓ Deleted ${shifts.count} shifts`);

        console.log('Deleting Staff...');
        const staff = await prisma.staff.deleteMany({});
        console.log(`✓ Deleted ${staff.count} staff members`);

        console.log('Deleting AppConfig...');
        const appConfig = await prisma.appConfig.deleteMany({});
        console.log(`✓ Deleted ${appConfig.count} app config entries`);

        console.log('Deleting SubscriptionPlans...');
        const plans = await prisma.subscriptionPlan.deleteMany({});
        console.log(`✓ Deleted ${plans.count} subscription plans`);

        console.log('\n✅ All data has been successfully deleted!');
        console.log('\n💡 To re-seed essential data (Super Admin), run:');
        console.log('   npm run seed');

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        throw error;
    }
}

clearAllData()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
