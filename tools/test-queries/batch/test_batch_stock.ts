import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testBatchStock() {
    console.log('🔍 Testing Batch Stock Calculation\n');

    try {
        // Get all products with batches
        const purchases = await prisma.purchaseItem.findMany({
            include: {
                product: { select: { name: true } },
                purchase: { select: { date: true } }
            },
            take: 5
        });

        if (purchases.length === 0) {
            console.log('❌ No purchase batches found. Please add some purchases first.');
            return;
        }

        for (const batch of purchases) {
            console.log(`\n📦 Batch ID: ${batch.id} | Product: ${batch.product.name}`);
            console.log(`   Purchased Quantity: ${batch.quantity}`);

            // Get total sold from this batch
            const sales = await prisma.saleItem.aggregate({
                where: {
                    productId: batch.productId,
                    batchId: batch.id
                },
                _sum: { quantity: true }
            });

            const soldQty = Number(sales._sum.quantity || 0);
            const remaining = Number(batch.quantity) - soldQty;

            console.log(`   Sold from Batch: ${soldQty}`);
            console.log(`   Remaining Stock: ${remaining}`);

            // Also check if there are sales without batch_id (shouldn't happen with current system)
            const unbatchedSales = await prisma.saleItem.findMany({
                where: {
                    productId: batch.productId,
                    batchId: null
                }
            });

            if (unbatchedSales.length > 0) {
                console.log(`   ⚠️  WARNING: Found ${unbatchedSales.length} sales without batch_id!`);
            }
        }

        console.log('\n✅ Batch stock test completed');
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testBatchStock();
