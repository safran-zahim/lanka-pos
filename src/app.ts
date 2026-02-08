import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const allowedOrigins = ['http://localhost:4173', 'http://localhost:5173'];
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
import subscriptionRoutes from './routes/subscription.routes';

app.use('/auth', authRoutes);
app.use('/staff', staffRoutes);
app.use('/products', productRoutes);
app.use('/sales', salesRoutes);
app.use('/customers', customerRoutes);
app.use('/categories', categoryRoutes);
app.use('/subscription', subscriptionRoutes);


export default app;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}
