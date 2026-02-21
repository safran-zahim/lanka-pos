const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const products = await prisma.product.findMany({
        include: {
            categoryRel: true,
            subCategory: true,
            brand: true,
            unit: true
        }
    });

    for (const product of products) {
        const purchaseAgg = await prisma.purchaseItem.aggregate({
            where: { productId: product.id },
            _sum: { quantity: true }
        });
        
        const saleAgg = await prisma.saleItem.aggregate({
            where: { productId: product.id },
            _sum: { quantity: true }
        });

        const totalPurchased = purchaseAgg._sum.quantity || 0;
        const totalSold = saleAgg._sum.quantity || 0;
        const stock = totalPurchased - totalSold;

        console.log(`Product: ${product.name} (ID: ${product.id})`);
        console.log(`  Category: ${product.categoryRel?.name || 'None'}`);
        console.log(`  SubCategory: ${product.subCategory?.name || 'None'}`);
        console.log(`  Purchased: ${totalPurchased}, Sold: ${totalSold}, Stock: ${stock}`);
        console.log('');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
