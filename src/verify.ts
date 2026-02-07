import app from './app';
import prisma from './utils/prisma';
import request from 'supertest';
import { Decimal } from 'decimal.js';

const runVerification = async () => {
    try {
        console.log('Starting Verification...');

        // 1. Setup Data
        console.log('Cleaning DB...');
        await prisma.saleItem.deleteMany();
        await prisma.sale.deleteMany();
        await prisma.shift.deleteMany();
        await prisma.product.deleteMany();
        await prisma.customer.deleteMany();
        await prisma.staff.deleteMany();

        console.log('Creating Admin User...');
        const admin = await prisma.staff.create({
            data: {
                name: 'admin',
                role: 'admin',
                password: 'password123',
            },
        });

        // 2. Login
        console.log('Testing Login...');
        const loginRes = await request(app)
            .post('/auth/login')
            .send({ username: 'admin', password: 'password123' });

        if (loginRes.status !== 200) throw new Error(`Login failed: ${JSON.stringify(loginRes.body)}`);
        const token = loginRes.body.token;
        console.log('Login successful.');

        // 3. Create Product
        console.log('Testing Create Product...');
        const prodRes = await request(app)
            .post('/products')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Test Product',
                category: 'General',
                price: 10.00,
                stock: 100,
                minStock: 5
            });

        if (prodRes.status !== 201) throw new Error(`Create Product failed: ${JSON.stringify(prodRes.body)}`);
        const productId = prodRes.body.id;
        console.log('Product created.');

        // 4. Create Customer
        console.log('Testing Create Customer...');
        const custRes = await request(app)
            .post('/customers')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'John Doe',
                phone: '1234567890'
            });

        if (custRes.status !== 201) throw new Error(`Create Customer failed: ${JSON.stringify(custRes.body)}`);
        const customerId = custRes.body.id;
        console.log('Customer created.');

        // 5. Checkout
        console.log('Testing Checkout...');
        const checkoutRes = await request(app)
            .post('/sales/checkout')
            .set('Authorization', `Bearer ${token}`)
            .send({
                staff_id: admin.id,
                customer_id: customerId,
                payment_method: 'cash',
                items: [
                    { product_id: productId, quantity: 2, unit_price: 10.00 }
                ],
                totals: {
                    subtotal: 20.00,
                    tax: 0,
                    discount: 0,
                    grand_total: 20.00
                }
            });

        if (checkoutRes.status !== 201) throw new Error(`Checkout failed: ${JSON.stringify(checkoutRes.body)}`);
        console.log('Checkout successful.');

        // 6. Verify Stock
        console.log('Verifying Stock...');
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (product?.stock !== 98) throw new Error(`Stock mismatch: expected 98, got ${product?.stock}`);
        console.log('Stock verified.');

        // 7. Daily Summary
        console.log('Testing Daily Summary...');
        const summaryRes = await request(app)
            .get('/sales/daily-summary')
            .set('Authorization', `Bearer ${token}`);

        if (summaryRes.status !== 200) throw new Error(`Daily Summary failed: ${JSON.stringify(summaryRes.body)}`);
        if (summaryRes.body.total_sales !== 20 && summaryRes.body.total_sales !== '20') throw new Error(`Total sales mismatch: expected 20, got ${summaryRes.body.total_sales}`);
        console.log('Daily Summary verified.');

        console.log('ALL TESTS PASSED!');
    } catch (error) {
        console.error('Verification Failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
};

if (require.main === module) {
    runVerification();
}

export default runVerification;
