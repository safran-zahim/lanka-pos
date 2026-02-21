import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearSalesData() {
    console.log('🗑️  Clearing sales data from database...\n');

    try {
        // Delete in order to respect foreign key constraints
        console.log('Deleting CustomerPointLedger...');
        const pointLedger = await prisma.customerPointLedger.deleteMany({});
        console.log(`✓ Deleted ${pointLedger.count} point ledger entries`);

        console.log('Deleting HeldSales...');
        const heldSales = await prisma.heldSale.deleteMany({});
        console.log(`✓ Deleted ${heldSales.count} held sales`);

        console.log('Deleting SaleItems...');
        const saleItems = await prisma.saleItem.deleteMany({});
        console.log(`✓ Deleted ${saleItems.count} sale items`);

        console.log('Deleting Sales...');
        const sales = await prisma.sale.deleteMany({});
        console.log(`✓ Deleted ${sales.count} sales`);

        // Reset customer points and spend
        console.log('Resetting customer points and spend...');
        const customerUpdate = await prisma.customer.updateMany({
            data: {
                pointsBalance: 0,
                totalSpend: 0
            }
        });
        console.log(`✓ Reset ${customerUpdate.count} customers`);

        console.log('\n✅ Sales data cleared successfully!');
        console.log('Note: Products, purchases, suppliers, and staff remain unchanged.');
    } catch (error) {
        console.error('❌ Error clearing sales data:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

clearSalesData();
