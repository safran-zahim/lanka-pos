import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearBusinessData() {
    console.log('🗑️  Starting SELECTIVE business data cleanup (Preserving Staff)...\n');

    try {
        // Delete in order to respect foreign key constraints

        console.log('Deleting CustomerPointLedger...');
        const pointLedger = await prisma.customerPointLedger.deleteMany({});
        console.log(`✓ Deleted ${pointLedger.count} point ledger entries`);

        console.log('Deleting CustomerPayment...');
        const customerPayments = await prisma.customerPayment.deleteMany({});
        console.log(`✓ Deleted ${customerPayments.count} customer payments`);

        console.log('Deleting SaleItems...');
        const saleItems = await prisma.saleItem.deleteMany({});
        console.log(`✓ Deleted ${saleItems.count} sale items`);

        console.log('Deleting Sales (including returns)...');
        const sales = await prisma.sale.deleteMany({});
        console.log(`✓ Deleted ${sales.count} sales`);

        console.log('Deleting HeldSales...');
        const heldSales = await prisma.heldSale.deleteMany({});
        console.log(`✓ Deleted ${heldSales.count} held sales`);

        console.log('Deleting Customers...');
        const customers = await prisma.customer.deleteMany({});
        console.log(`✓ Deleted ${customers.count} customers`);

        console.log('Deleting Expense...');
        const expenses = await prisma.expense.deleteMany({});
        console.log(`✓ Deleted ${expenses.count} expenses`);

        console.log('Deleting PurchasePayments...');
        const purchasePayments = await prisma.purchasePayment.deleteMany({});
        console.log(`✓ Deleted ${purchasePayments.count} purchase payments`);

        console.log('Deleting PurchaseItems...');
        const purchaseItems = await prisma.purchaseItem.deleteMany({});
        console.log(`✓ Deleted ${purchaseItems.count} purchase items (batches)`);

        console.log('Deleting Purchases...');
        const purchases = await prisma.purchase.deleteMany({});
        console.log(`✓ Deleted ${purchases.count} purchases`);

        console.log('Deleting Products...');
        const products = await prisma.product.deleteMany({});
        console.log(`✓ Deleted ${products.count} products`);

        console.log('Deleting SubCategories...');
        const subCategories = await prisma.subCategory.deleteMany({});
        console.log(`✓ Deleted ${subCategories.count} subcategories`);

        console.log('Deleting Categories...');
        const categories = await prisma.category.deleteMany({});
        console.log(`✓ Deleted ${categories.count} categories`);

        console.log('Deleting Brands...');
        const brands = await prisma.brand.deleteMany({});
        console.log(`✓ Deleted ${brands.count} brands`);

        console.log('Deleting Units...');
        const units = await prisma.unit.deleteMany({});
        console.log(`✓ Deleted ${units.count} units`);

        console.log('Deleting Suppliers...');
        const suppliers = await prisma.supplier.deleteMany({});
        console.log(`✓ Deleted ${suppliers.count} suppliers`);

        console.log('Deleting Shifts...');
        const shifts = await prisma.shift.deleteMany({});
        console.log(`✓ Deleted ${shifts.count} shifts`);

        console.log('\n✅ BUSINESS DATA HAS BEEN DELETED!');
        console.log('\n💎 PRESERVED DATA:');
        const staffCount = await prisma.staff.count();
        console.log(`   - Staff: ${staffCount} members preserved`);

        const configCount = await prisma.appConfig.count();
        console.log(`   - App Config: ${configCount} entries preserved`);

        const planCount = await prisma.subscriptionPlan.count();
        console.log(`   - Subscription Plans: ${planCount} preserved`);

        const settingCount = await prisma.setting.count();
        console.log(`   - Settings: ${settingCount} preserved`);

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        throw error;
    }
}

clearBusinessData()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
