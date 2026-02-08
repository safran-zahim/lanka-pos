import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDummyData() {
    console.log('🧹 Starting selective data cleanup (preserving credentials)...\n');

    try {
        // Delete transactional data first (respecting foreign keys)
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

        // WE DO NOT DELETE: Staff (login credentials), AppConfig, SubscriptionPlans

        console.log('\n✅ Data cleanup complete!');
        console.log('✨ Login credentials and system settings were preserved.');
        console.log('\n💡 You can now start with a fresh set of products and customers.');

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        throw error;
    }
}

cleanupDummyData()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
