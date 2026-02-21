
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('--- Initial State ---');
        const initialProducts = await prisma.product.findMany({ select: { id: true, name: true, isActive: true } });
        console.log(JSON.stringify(initialProducts, null, 2));

        if (initialProducts.length === 0) {
            console.log('No products found to test.');
            return;
        }

        const testProduct = initialProducts[0];
        console.log(`\n--- Testing Toggle on Product ID: ${testProduct.id} (${testProduct.name}) ---`);

        // Toggle OFF
        const updated1 = await prisma.product.update({
            where: { id: testProduct.id },
            data: { isActive: !testProduct.isActive }
        });
        console.log(`[Step 1] Toggled to: ${updated1.isActive} (Expected: ${!testProduct.isActive})`);

        // Toggle ON (Revert)
        const updated2 = await prisma.product.update({
            where: { id: testProduct.id },
            data: { isActive: !updated1.isActive }
        });
        console.log(`[Step 2] Reverted to: ${updated2.isActive} (Expected: ${testProduct.isActive})`);

        console.log('\n--- Final State Validation ---');
        const finalProduct = await prisma.product.findUnique({ where: { id: testProduct.id }, select: { isActive: true } });
        console.log(`Final Database Status: ${finalProduct?.isActive}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
