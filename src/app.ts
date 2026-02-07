import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('POS Backend is running');
});


import authRoutes from './routes/auth.routes';
import staffRoutes from './routes/staff.routes';
import productRoutes from './routes/product.routes';
import salesRoutes from './routes/sales.routes';
import customerRoutes from './routes/customer.routes';
import categoryRoutes from './routes/category.routes';

app.use('/auth', authRoutes);
app.use('/staff', staffRoutes);
app.use('/products', productRoutes);
app.use('/sales', salesRoutes);
app.use('/customers', customerRoutes);
app.use('/categories', categoryRoutes);


export default app;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}
