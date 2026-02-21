import prisma from './src/utils/prisma';

async function main() {
    const products = await prisma.product.findMany({
        where: { isActive: true },
        select: {
            id: true,
            name: true,
            reorderLevel: true,
        }
    });

    const enriched = await Promise.all(products.map(async (product) => {
        const totalPurchased = await prisma.purchaseItem.aggregate({
            where: { productId: product.id },
            _sum: { quantity: true }
        });
        const totalSold = await prisma.saleItem.aggregate({
            where: { productId: product.id },
            _sum: { quantity: true }
        });

        const stock = Number(totalPurchased._sum.quantity || 0) - Number(totalSold._sum.quantity || 0);
        const alertLevel = Number(product.reorderLevel || 0);

        return {
            id: product.id,
            name: product.name,
            reorderLevel: product.reorderLevel,
            parsedAlertLevel: alertLevel,
            stock: stock
        };
    }));

    console.log("ALL ACTIVE PRODUCTS:");
    console.log(JSON.stringify(enriched, null, 2));

    const lowStock = enriched.filter(p => p.stock < p.parsedAlertLevel);
    console.log("\nLOW STOCK PRODUCTS:");
    console.log(JSON.stringify(lowStock, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
