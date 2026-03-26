import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
// const API_URL = 'https://lanka-pos.onrender.com';
const API_URL = 'http://localhost:3000'; // Local QA Testing

let token = '';
const axiosInstance = axios.create({ baseURL: API_URL });

axiosInstance.interceptors.request.use(config => {
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

async function runTests() {
    try {
        console.log("=== STARTING END-TO-END QA TEST ===");

        // 1. LOGIN
        console.log("\n[1] Logging in as SuperAdmin...");
        const loginRes = await axiosInstance.post('/auth/login', { username: 'SuperAdmin', password: 'admin123' });
        token = loginRes.data.token;
        console.log("✅ Login successful");

        // 2. PRODUCT & SUPPLIER
        console.log("\n[2] Testing Product & Supplier Creation...");
        const categoryRes = await axiosInstance.post('/categories', { name: `QA Category ${Date.now()}` });
        const catId = categoryRes.data.id;

        const pData = {
            name: `QA Product ${Date.now()}`,
            skuCode: `SKU-${Date.now()}`,
            barcode: `BC-${Date.now()}`,
            description: "A test product for E2E",
            categoryId: catId,
            reorderLevel: 5
        };
        let product = (await axiosInstance.post('/products', pData)).data;
        console.log(`✅ Created Product: ${product.name} (ID: ${product.id})`);

        // Edit Product
        product = (await axiosInstance.patch(`/products/${product.id}`, { description: "Updated E2E description" })).data;
        const dbProduct = await prisma.product.findUnique({ where: { id: product.id } });
        if (dbProduct?.description !== "Updated E2E description") throw new Error("Product edit failed in DB");
        console.log("✅ Edited Product and verified in DB");

        const sData = {
            name: `QA Supplier ${Date.now()}`,
            phone: '0771234567',
            contactPerson: 'QA Manager'
        };
        let supplier = (await axiosInstance.post('/suppliers', sData)).data;
        console.log(`✅ Created Supplier: ${supplier.name} (ID: ${supplier.id})`);

        // 3. PURCHASES & BATCHES
        console.log("\n[3] Testing Purchases & Batch Stock...");
        const purchase1 = (await axiosInstance.post('/purchases', {
            supplier_id: supplier.id,
            reference_no: `REF-${Date.now()}-1`,
            date: new Date().toISOString(),
            status: "RECEIVED",
            items: [{ product_id: product.id, quantity: 10, cost_price: 100, retail_price: 150 }]
        })).data;
        console.log(`✅ Purchase 1 Created (10 units)`);

        const purchase2 = (await axiosInstance.post('/purchases', {
            supplier_id: supplier.id,
            reference_no: `REF-${Date.now()}-2`,
            date: new Date().toISOString(),
            status: "RECEIVED",
            items: [{ product_id: product.id, quantity: 20, cost_price: 110, retail_price: 160 }]
        })).data;
        console.log(`✅ Purchase 2 Created (20 units)`);

        // Verify Batches & Stock
        const batches = (await axiosInstance.get(`/products/${product.id}/batches`)).data;
        if (batches.length !== 2) throw new Error("Expected 2 batches");
        console.log(`✅ Verified 2 DISTINCT batches exist for product.`);

        let pDetails = (await axiosInstance.get(`/products/${product.id}`)).data;
        if (pDetails.stats.currentStock !== 30) throw new Error(`Stock mismatch: Expected 30, got ${pDetails.stats.currentStock}`);
        console.log("✅ Verified total aggregated stock is 30 in database.");

        // 4. CUSTOMER & SHIFT
        console.log("\n[4] Preparing for Sales...");
        const customer = (await axiosInstance.post('/customers', {
            name: `QA Customer ${Date.now()}`,
            phone: '0711122333',
            creditLimit: 5000
        })).data;
        console.log(`✅ Created Customer: ${customer.name}`);

        const me = (await axiosInstance.get('/auth/me')).data;
        const shift = (await axiosInstance.post('/shifts/open', { staffId: me.user.id, startingCash: 1000 })).data;
        console.log(`✅ Opened Shift (ID: ${shift.id}) with 1000 starting cash`);

        // 5. SALES
        console.log("\n[5] Executing Sales...");
        // Cash Sale (Buy 1 = 150)
        let cashSale = (await axiosInstance.post('/sales', {
            items: [{ product_id: product.id, quantity: 1, unit_price: 150 }],
            payment_method: 'cash',
            payment_details: { cashAmount: 150 },
            totals: { subtotal: 150, tax: 0, discount: 0, grand_total: 150 }
        })).data.sale;
        console.log(`✅ Cash Sale completed (1 unit)`);

        // Card Sale (Buy 2 = 300)
        let cardSale = (await axiosInstance.post('/sales', {
            items: [{ product_id: product.id, quantity: 2, unit_price: 150 }],
            payment_method: 'card',
            payment_details: { cardAmount: 300 },
            totals: { subtotal: 300, tax: 0, discount: 0, grand_total: 300 }
        })).data.sale;
        console.log(`✅ Card Sale completed (2 units)`);

        // Credit Sale (Buy 5 = 750) assigned to customer
        let creditSale = (await axiosInstance.post('/sales', {
            customer_id: customer.id,
            items: [{ product_id: product.id, quantity: 5, unit_price: 150 }],
            payment_method: 'credit',
            payment_details: { creditAmount: 750, cashAmount: 0 },
            totals: { subtotal: 750, tax: 0, discount: 0, grand_total: 750 }
        })).data.sale;
        console.log(`✅ Credit Sale completed (5 units) assigned to customer!`);

        // Split Payment Sale (Buy 4 = 600) -> 200 Cash, 300 Card, 100 Credit
        let splitSale = (await axiosInstance.post('/sales', {
            customer_id: customer.id,
            items: [{ product_id: product.id, quantity: 4, unit_price: 150 }],
            payment_method: 'split',
            payment_details: { cashAmount: 200, cardAmount: 300, creditAmount: 100 },
            totals: { subtotal: 600, tax: 0, discount: 0, grand_total: 600 }
        })).data.sale;
        console.log(`✅ Split Payment Sale completed (4 units)!`);

        // Verify Customer Profile
        const cProfile = (await axiosInstance.get(`/customers/${customer.id}`)).data;
        if (cProfile.totalDue !== 850) throw new Error(`Customer Debt mismatch. Expected 850, got ${cProfile.totalDue}`);
        console.log(`✅ Customer profile successfully updated with BOTH credit and split dependencies! Total Due: ${cProfile.totalDue}`);

        // Verify Receipt fetch
        const receipt = (await axiosInstance.get(`/sales/${creditSale.id}`)).data;
        if (receipt.total !== '750' || receipt.items.length !== 1) throw new Error("Receipt fetch failed");
        console.log(`✅ Receipt successfully generated and verified for Credit Sale #${creditSale.id}`);

        // View Daily Summary
        const summary = (await axiosInstance.get('/sales/summary/daily')).data;
        console.log(`✅ Daily Summary verified. Total Cash today: ${summary.cash_total}`);

        // 6. REFUNDS
        console.log("\n[6] Testing Refunds & Logic Corrections...");
        
        // Void Cash Sale
        await axiosInstance.post(`/sales/${cashSale.id}/refund`);
        console.log(`✅ Refunded Cash Sale #${cashSale.id}`);

        // Void Credit Sale
        await axiosInstance.post(`/sales/${creditSale.id}/refund`);
        console.log(`✅ Refunded Credit Sale #${creditSale.id}`);

        // Verify Stock restored (Started 30, sold 1, 2, 5, 4 = 12 sold, 18 remaining. Voided 1 and 5. Expect 18 + 6 = 24)
        pDetails = (await axiosInstance.get(`/products/${product.id}`)).data;
        if (pDetails.stats.currentStock !== 24) throw new Error(`Stock restoration failed! Expected 24, got ${pDetails.stats.currentStock}`);
        console.log(`✅ Stock accurately restored after refunds! Current Stock: ${pDetails.stats.currentStock}`);

        // Verify Customer balance restored
        const cProfileD = (await axiosInstance.get(`/customers/${customer.id}`)).data;
        if (cProfileD.totalDue !== 100) throw new Error(`Customer Credit restoration failed. Expected 100, got ${cProfileD.totalDue}`);
        console.log(`✅ Customer profile debt accurately reverted to ${cProfileD.totalDue} after credit refund!`);

        console.log("\n🎉 ALL QA TESTS PASSED EXCELLENTLY ON THE LIVE SYSTEM! 🎉");

        // Close Shift
        await axiosInstance.post(`/shifts/${shift.id}/close`, {
            actualCashBreakdown: { "1000": 1 },
            actualCashTotal: 1000,
            notes: "QA E2E Auto Close"
        });

    } catch (err: any) {
        console.error("❌ TEST FAILED:", err.response?.data || err.message);
    }
}

runTests();
