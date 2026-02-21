import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Fetching low stock...");
    const products = await prisma.product.findMany({
        where: { isActive: true },
        select: { id: true, name: true, reorderLevel: true }
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
            stock,
            alertLevel
        };
    }));

    const lowStock = enriched.filter(p => p.stock <= p.alertLevel);
    console.log("All products stock:");
    console.table(enriched);

    console.log("\nLow stock items:");
    console.table(lowStock);
}

main().catch(console.error).finally(() => prisma.$disconnect());
