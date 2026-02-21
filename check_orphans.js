const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkInventoryDiscrepancies() {
    try {
        const products = await prisma.product.findMany();
        console.log(`Checking ${products.length} products...\n`);

        for (const product of products) {
            const [purchaseAgg, saleAgg] = await Promise.all([
                prisma.purchaseItem.aggregate({
                    where: { productId: product.id },
                    _sum: { quantity: true }
                }),
                prisma.saleItem.aggregate({
                    where: { productId: product.id },
                    _sum: { quantity: true }
                })
            ]);

            const totalPurchased = Number(purchaseAgg._sum.quantity || 0);
            const totalSold = Number(saleAgg._sum.quantity || 0);
            const totalStock = totalPurchased - totalSold;

            const batches = await prisma.purchaseItem.findMany({
                where: { productId: product.id }
            });

            let sumOfBatchStock = 0;
            let overSoldBatches = [];

            for (const batch of batches) {
                const batchSales = await prisma.saleItem.aggregate({
                    where: { batchId: batch.id },
                    _sum: { quantity: true }
                });
                const soldFromBatch = Number(batchSales._sum.quantity || 0);
                const remainingInBatch = Number(batch.quantity) - soldFromBatch;
                sumOfBatchStock += Math.max(0, remainingInBatch);

                if (remainingInBatch < 0) {
                    overSoldBatches.push({ id: batch.id, remaining: remainingInBatch });
                }
            }

            if (totalStock !== sumOfBatchStock) {
                console.log(`DISCREPANCY for Product ${product.id} (${product.name}):`);
                console.log(`  Card Stock (Total): ${totalStock}`);
                console.log(`  Sum of Batches: ${sumOfBatchStock}`);
                console.log(`  Difference: ${sumOfBatchStock - totalStock}`);
                if (overSoldBatches.length > 0) {
                    console.log(`  Over-sold Batches: ${JSON.stringify(overSoldBatches)}`);
                }

                const orphanSales = await prisma.saleItem.aggregate({
                    where: { productId: product.id, batchId: null },
                    _sum: { quantity: true }
                });
                if (Number(orphanSales._sum.quantity || 0) > 0) {
                    console.log(`  Orphan Sales Qty: ${Number(orphanSales._sum.quantity)}`);
                }
                console.log('---');
            }
        }

    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

checkInventoryDiscrepancies();
