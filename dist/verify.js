"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const prisma_1 = __importDefault(require("./utils/prisma"));
const supertest_1 = __importDefault(require("supertest"));
const runVerification = async () => {
    try {
        console.log('Starting Verification...');
        // 1. Setup Data
        console.log('Cleaning DB...');
        await prisma_1.default.saleItem.deleteMany();
        await prisma_1.default.sale.deleteMany();
        await prisma_1.default.shift.deleteMany();
        await prisma_1.default.product.deleteMany();
        await prisma_1.default.customer.deleteMany();
        await prisma_1.default.staff.deleteMany();
        console.log('Creating Admin User...');
        const admin = await prisma_1.default.staff.create({
            data: {
                name: 'admin',
                role: 'admin',
                password: 'password123',
            },
        });
        // 2. Login
        console.log('Testing Login...');
        const loginRes = await (0, supertest_1.default)(app_1.default)
            .post('/auth/login')
            .send({ username: 'admin', password: 'password123' });
        if (loginRes.status !== 200)
            throw new Error(`Login failed: ${JSON.stringify(loginRes.body)}`);
        const token = loginRes.body.token;
        console.log('Login successful.');
        // 3. Create Product
        console.log('Testing Create Product...');
        const prodRes = await (0, supertest_1.default)(app_1.default)
            .post('/products')
            .set('Authorization', `Bearer ${token}`)
            .send({
            name: 'Test Product',
            category: 'General',
            price: 10.00,
            stock: 100,
            minStock: 5
        });
        if (prodRes.status !== 201)
            throw new Error(`Create Product failed: ${JSON.stringify(prodRes.body)}`);
        const productId = prodRes.body.id;
        console.log('Product created.');
        // 4. Create Customer
        console.log('Testing Create Customer...');
        const custRes = await (0, supertest_1.default)(app_1.default)
            .post('/customers')
            .set('Authorization', `Bearer ${token}`)
            .send({
            name: 'John Doe',
            phone: '1234567890'
        });
        if (custRes.status !== 201)
            throw new Error(`Create Customer failed: ${JSON.stringify(custRes.body)}`);
        const customerId = custRes.body.id;
        console.log('Customer created.');
        // 5. Checkout
        console.log('Testing Checkout...');
        const checkoutRes = await (0, supertest_1.default)(app_1.default)
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
        if (checkoutRes.status !== 201)
            throw new Error(`Checkout failed: ${JSON.stringify(checkoutRes.body)}`);
        console.log('Checkout successful.');
        // 6. Verify Stock
        console.log('Verifying Stock...');
        const product = await prisma_1.default.product.findUnique({ where: { id: productId } });
        if (product?.stock !== 98)
            throw new Error(`Stock mismatch: expected 98, got ${product?.stock}`);
        console.log('Stock verified.');
        // 7. Daily Summary
        console.log('Testing Daily Summary...');
        const summaryRes = await (0, supertest_1.default)(app_1.default)
            .get('/sales/daily-summary')
            .set('Authorization', `Bearer ${token}`);
        if (summaryRes.status !== 200)
            throw new Error(`Daily Summary failed: ${JSON.stringify(summaryRes.body)}`);
        if (summaryRes.body.total_sales !== 20 && summaryRes.body.total_sales !== '20')
            throw new Error(`Total sales mismatch: expected 20, got ${summaryRes.body.total_sales}`);
        console.log('Daily Summary verified.');
        console.log('ALL TESTS PASSED!');
    }
    catch (error) {
        console.error('Verification Failed:', error);
        process.exit(1);
    }
    finally {
        await prisma_1.default.$disconnect();
    }
};
if (require.main === module) {
    runVerification();
}
exports.default = runVerification;
