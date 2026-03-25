import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    // 1. Create a product with 0 stock and 0 alert level
    const p3 = await prisma.product.create({
        data: {
            name: "p3_test_0_0",
            reorderLevel: 0,
            isActive: true
        }
    });

    console.log("Created p3:", p3.id);

    // 2. Run the getLowStock logic
    const products = await prisma.product.findMany({
        where: { isActive: true },
        include: { categoryRel: true, brand: true, unit: true, subCategory: true },
        orderBy: { name: 'asc' }
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
            ...product,
            stock,
            stock_quantity: stock,
            alert_quantity: alertLevel,
            reorder_level: alertLevel,
            category_name: product.categoryRel?.name,
            brand_name: product.brand?.name,
            sku_code: product.skuCode,
            barcode_type: product.barcodeType
        };
    }));

    const lowStock = enriched.filter((product) => {
        const alertLevel = Number(product.reorderLevel || 0);
        return product.stock <= alertLevel;
    });

    console.log("\nLOW STOCK RESULT:");
    console.log(JSON.stringify(lowStock.map(p => ({ name: p.name, stock: p.stock, alertLevel: p.alert_quantity })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
