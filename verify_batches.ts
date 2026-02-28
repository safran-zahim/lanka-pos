import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Batch & FIFO Verification Script');

    try {
        // 1. Setup - Create test category and product
        const category = await prisma.category.upsert({
            where: { name: 'Test Category' },
            update: {},
            create: { name: 'Test Category' }
        });

        const product = await prisma.product.upsert({
            where: { skuCode: 'TEST-FIFO-001' },
            update: { isActive: true },
            create: {
                name: 'Test FIFO Product',
                skuCode: 'TEST-FIFO-001',
                categoryId: category.id,
                price: 150,
                reorderLevel: 5
            }
        });

        console.log(`✅ Product created: ${product.name} (ID: ${product.id})`);

        // 2. Add Supplier
        const supplier = await prisma.supplier.upsert({
            where: { id: 1 }, // Assuming ID 1 exists or use any
            update: {},
            create: { name: 'Test Supplier', phone: '1234567890' }
        });

        // 3. Purchase Batch 1: Qty 10, Price 100
        const purchase1 = await prisma.purchase.create({
            data: {
                supplierId: supplier.id,
                totalAmount: 1000,
                status: 'COMPLETED',
                items: {
                    create: {
                        productId: product.id,
                        quantity: 10,
                        costPrice: 80,
                        retailPrice: 100
                    }
                }
            },
            include: { items: true }
        });
        const batch1Id = purchase1.items[0].id;
        console.log(`✅ Batch 1 created: ID ${batch1Id}, Qty 10, Price 100`);

        // 4. Purchase Batch 2: Qty 10, Price 120
        const purchase2 = await prisma.purchase.create({
            data: {
                supplierId: supplier.id,
                totalAmount: 1200,
                status: 'COMPLETED',
                items: {
                    create: {
                        productId: product.id,
                        quantity: 10,
                        costPrice: 90,
                        retailPrice: 120
                    }
                }
            },
            include: { items: true }
        });
        const batch2Id = purchase2.items[0].id;
        console.log(`✅ Batch 2 created: ID ${batch2Id}, Qty 10, Price 120`);

        // 5. Login to get token
        console.log('\n🔐 Logging in to get token...');
        const loginResponse = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'SuperAdmin', password: 'admin123' })
        });

        if (!loginResponse.ok) {
            throw new Error(`Login failed: ${await loginResponse.text()}`);
        }

        const { token } = await loginResponse.json();
        console.log('✅ Logged in successfully');

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        // 6. Test FIFO Sale: 15 units (unbatched)
        console.log('\n🛒 Simulating sale of 15 units...');

        // We'll call the internal logic or simulate the checkout body
        // For verification, we'll manually trigger a "sale" and check if it follows our logic
        // But better is to use the API if possible, or just mock the logic here for verification of "intended behavior"
        // Actually, I'll use a fetch to the local server if it's running.
        // The server is running at http://localhost:3000 according to logs.

        const checkoutData = {
            staff_id: 1, // SuperAdmin
            payment_method: 'cash',
            items: [{
                product_id: product.id,
                quantity: 15,
                unit_price: 150
            }],
            totals: {
                subtotal: 2250,
                tax: 0,
                discount: 0,
                grand_total: 2250
            }
        };

        const response = await fetch('http://localhost:3000/sales/checkout', {
            method: 'POST',
            headers,
            body: JSON.stringify(checkoutData)
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(`❌ Checkout HTTP Error ${response.status}:`, errText);
            throw new Error(`Checkout failed with status ${response.status}`);
        }

        let sale;
        try {
            sale = await response.json();
        } catch (e) {
            const text = await response.text();
            console.error('❌ Failed to parse response as JSON. Body:', text);
            throw e;
        }
        console.log(`✅ Sale created: ID ${sale.id}`);

        // 7. Verify Sale Items (Should be split)
        const saleItems = await prisma.saleItem.findMany({
            where: { saleId: sale.id },
            orderBy: { batchId: 'asc' }
        });

        console.log(`\n📊 Verifying Sale Items:`);
        saleItems.forEach(si => {
            console.log(`   - Batch ${si.batchId}: Qty ${si.quantity}`);
        });

        if (saleItems.length !== 2) {
            console.log('❌ FAIL: Expected 2 sale items (split across batches), found ' + saleItems.length);
        } else if (Number(saleItems[0].quantity) === 10 && Number(saleItems[1].quantity) === 5) {
            console.log('✅ PASS: Sale correctly split across batches (10 from Batch 1, 5 from Batch 2)');
        } else {
            console.log('❌ FAIL: Incorrect quantities in split batches');
        }

        // 8. Test Refund
        console.log('\n🔄 Simulating refund...');
        const refundData = {
            staff_id: 1,
            parent_sale_id: sale.id,
            payment_method: 'cash',
            items: [
                { product_id: product.id, quantity: -10, unit_price: 100, batch_id: batch1Id },
                { product_id: product.id, quantity: -5, unit_price: 120, batch_id: batch2Id }
            ],
            totals: {
                subtotal: -1500, // (10*100 + 5*120) = 1600. Wait, prices were 100 and 120.
                tax: 0,
                discount: 0,
                grand_total: -1600
            }
        };

        // Correcting totals based on batch prices used in sale
        refundData.totals.subtotal = -1600;
        refundData.totals.grand_total = -1600;

        const refundResponse = await fetch('http://localhost:3000/sales/checkout', {
            method: 'POST',
            headers,
            body: JSON.stringify(refundData)
        });

        if (!refundResponse.ok) {
            const errText = await refundResponse.text();
            console.error(`❌ Refund HTTP Error ${refundResponse.status}:`, errText);
            throw new Error(`Refund failed with status ${refundResponse.status}`);
        }

        const refundSale = await refundResponse.json();
        console.log(`✅ Refund Sale created: ID ${refundSale.id}`);

        // 9. Final Stock Verification
        const batch1Sales = await prisma.saleItem.aggregate({
            where: { productId: product.id, batchId: batch1Id },
            _sum: { quantity: true }
        });
        const batch2Sales = await prisma.saleItem.aggregate({
            where: { productId: product.id, batchId: batch2Id },
            _sum: { quantity: true }
        });

        const b1Stock = 10 - Number(batch1Sales._sum.quantity || 0);
        const b2Stock = 10 - Number(batch2Sales._sum.quantity || 0);

        console.log(`\n📦 Final Stock Levels:`);
        console.log(`   - Batch 1: ${b1Stock} (Expected: 10)`);
        console.log(`   - Batch 2: ${b2Stock} (Expected: 10)`);

        if (b1Stock === 10 && b2Stock === 10) {
            console.log('✅ PASS: Stocks fully restored after refund');
        } else {
            console.log('❌ FAIL: Stock discrepancies found');
        }

    } catch (error) {
        console.error('❌ Error during verification:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
