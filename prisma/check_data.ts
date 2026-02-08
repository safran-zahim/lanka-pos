import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
    console.log('📊 Database Status Check\n');
    console.log('='.repeat(50));

    try {
        const staff = await prisma.staff.count();
        const products = await prisma.product.count();
        const categories = await prisma.category.count();
        const customers = await prisma.customer.count();
        const sales = await prisma.sale.count();
        const saleItems = await prisma.saleItem.count();
        const shifts = await prisma.shift.count();
        const pointLedger = await prisma.customerPointLedger.count();
        const plans = await prisma.subscriptionPlan.count();
        const appConfig = await prisma.appConfig.count();

        console.log(`Staff:                ${staff}`);
        console.log(`Products:             ${products}`);
        console.log(`Categories:           ${categories}`);
        console.log(`Customers:            ${customers}`);
        console.log(`Sales:                ${sales}`);
        console.log(`Sale Items:           ${saleItems}`);
        console.log(`Shifts:               ${shifts}`);
        console.log(`Point Ledger:         ${pointLedger}`);
        console.log(`Subscription Plans:   ${plans}`);
        console.log(`App Config:           ${appConfig}`);
        console.log('='.repeat(50));

        const total = staff + products + categories + customers + sales +
            saleItems + shifts + pointLedger + plans + appConfig;

        if (total === 0) {
            console.log('\n✅ Database is EMPTY - All data has been cleared!');
            console.log('\n💡 Run "npm run seed" to create Super Admin account');
        } else {
            console.log(`\n📦 Database contains ${total} total records`);
        }

    } catch (error) {
        console.error('❌ Error checking database:', error);
        throw error;
    }
}

checkData()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
