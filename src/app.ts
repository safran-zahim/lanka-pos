import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[Request] ${req.method} ${req.url}`);
    next();
});

const allowedOrigins = ['http://localhost:4173', 'http://localhost:5173', 'http://localhost:5174'];
app.use((req, res, next) => {
    const origin = req.headers.origin as string | undefined;
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});

app.get('/', (req, res) => {
    res.send('POS Backend is running');
});


import authRoutes from './routes/auth.routes';
import staffRoutes from './routes/staff.routes';
import productRoutes from './routes/product.routes';
import salesRoutes from './routes/sales.routes';
import customerRoutes from './routes/customer.routes';
import categoryRoutes from './routes/category.routes';
import settingsRoutes from './routes/settings.routes';


import subscriptionRoutes from './routes/subscription.routes';
import supplierRoutes from './routes/supplier.routes';
import bulkRoutes from './routes/bulk.routes';
import brandRoutes from './routes/brand.routes';
import unitRoutes from './routes/unit.routes';
import purchaseRoutes from './routes/purchase.routes';
import expenseRoutes from './routes/expense.routes';
import shiftRoutes from './routes/shift.routes';
import transactionRoutes from './routes/transaction.routes';

app.use('/auth', authRoutes);
app.use('/staff', staffRoutes);
app.use('/products', productRoutes);
app.use('/sales', salesRoutes);
app.use('/customers', customerRoutes);
app.use('/categories', categoryRoutes);
app.use('/settings', settingsRoutes);
app.use('/subscription', subscriptionRoutes);
app.use('/suppliers', supplierRoutes);
app.use('/bulk', bulkRoutes);
app.use('/brands', brandRoutes);
app.use('/units', unitRoutes);
app.use('/purchases', purchaseRoutes);
app.use('/expenses', expenseRoutes);
app.use('/shifts', shiftRoutes);
app.use('/transactions', transactionRoutes);


export default app;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}
