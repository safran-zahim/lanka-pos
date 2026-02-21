import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearAllData() {
    console.log('🗑️  Starting COMPLETE database cleanup...\n');

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

        console.log('Deleting Customers...');
        const customers = await prisma.customer.deleteMany({});
        console.log(`✓ Deleted ${customers.count} customers`);

        console.log('Deleting Expenses...');
        const expenses = await prisma.expense.deleteMany({});
        console.log(`✓ Deleted ${expenses.count} expenses`);

        console.log('Deleting PurchasePayments...');
        const payments = await prisma.purchasePayment.deleteMany({});
        console.log(`✓ Deleted ${payments.count} purchase payments`);

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

        console.log('Deleting Staff...');
        const staff = await prisma.staff.deleteMany({});
        console.log(`✓ Deleted ${staff.count} staff members`);

        console.log('Deleting Settings...');
        const settings = await prisma.setting.deleteMany({});
        console.log(`✓ Deleted ${settings.count} settings`);

        console.log('Deleting AppConfig...');
        const appConfig = await prisma.appConfig.deleteMany({});
        console.log(`✓ Deleted ${appConfig.count} app config entries`);

        console.log('Deleting SubscriptionPlans...');
        const plans = await prisma.subscriptionPlan.deleteMany({});
        console.log(`✓ Deleted ${plans.count} subscription plans`);

        console.log('\n✅ ALL DATABASE DATA HAS BEEN COMPLETELY DELETED!');
        console.log('\n⚠️  WARNING: This includes:');
        console.log('   - All sales and transactions');
        console.log('   - All products and inventory');
        console.log('   - All purchases and batches');
        console.log('   - All customers and staff');
        console.log('   - All settings and configuration');
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
