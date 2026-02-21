const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const purchaseItems = await prisma.purchaseItem.findMany();
    const saleItems = await prisma.saleItem.findMany();
    
    console.log('Purchase Items Count:', purchaseItems.length);
    console.log('Purchase Items:', JSON.stringify(purchaseItems, null, 2));
    console.log('\nSale Items Count:', saleItems.length);
    console.log('Sale Items:', JSON.stringify(saleItems, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
