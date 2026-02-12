import { Router } from 'express';
import { getProducts, createProduct, updateProduct, getLowStock, getProductDetails } from '../controllers/product.controller';
import { authenticate, authorize, requireActiveSubscription } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, requireActiveSubscription, getProducts); // All
router.get('/:id', authenticate, requireActiveSubscription, getProductDetails); // All (or limit?)
router.post('/', authenticate, requireActiveSubscription, authorize(['admin']), createProduct); // Admin
router.patch('/:id', authenticate, requireActiveSubscription, authorize(['manager', 'admin']), updateProduct); // Manager+
router.get('/low-stock', authenticate, requireActiveSubscription, authorize(['manager', 'admin']), getLowStock); // Manager+

export default router;
