import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyCounts() {
    console.log('🔍 Verifying database counts...\n');

    try {
        const staffCount = await prisma.staff.count();
        const saleCount = await prisma.sale.count();
        const productCount = await prisma.product.count();
        const customerCount = await prisma.customer.count();
        const configCount = await prisma.appConfig.count();

        console.log(`Staff: ${staffCount} (Should be > 0)`);
        console.log(`Sales: ${saleCount} (Should be 0)`);
        console.log(`Products: ${productCount} (Should be 0)`);
        console.log(`Customers: ${customerCount} (Should be 0)`);
        console.log(`AppConfig: ${configCount} (Should be > 0)`);

        if (staffCount > 0 && saleCount === 0 && productCount === 0 && customerCount === 0) {
            console.log('\n✅ Verification SUCCESSFUL: Business data cleared, Staff preserved.');
        } else {
            console.log('\n❌ Verification FAILED: Unexpected record counts.');
        }

    } catch (error) {
        console.error('❌ Error during verification:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyCounts();
