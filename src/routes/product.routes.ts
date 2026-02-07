import { Router } from 'express';
import { getProducts, createProduct, updateProduct, getLowStock } from '../controllers/product.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getProducts); // All
router.post('/', authenticate, authorize(['admin']), createProduct); // Admin
router.patch('/:id', authenticate, authorize(['manager', 'admin']), updateProduct); // Manager+
router.get('/low-stock', authenticate, authorize(['manager', 'admin']), getLowStock); // Manager+

export default router;
