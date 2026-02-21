import { Router } from 'express';
import { getProducts, createProduct, updateProduct, getLowStock, getProductDetails, deleteProduct, getProductBatches, toggleProductStatus } from '../controllers/product.controller';
import { authenticate, authorize, requireActiveSubscription } from '../middleware/auth.middleware';

const router = Router();
console.log('--- PRODUCT ROUTES LOADED ---'); // DEBUG: Verify file load

router.get('/low-stock', authenticate, requireActiveSubscription, authorize(['manager', 'admin']), getLowStock); // Manager+ - MOVED UP
router.get('/', authenticate, requireActiveSubscription, getProducts); // All
router.get('/:id/batches', authenticate, requireActiveSubscription, getProductBatches); // All
router.patch('/:id/toggle-status', authenticate, requireActiveSubscription, authorize(['admin']), toggleProductStatus); // Admin - MOVED UP
router.get('/:id', authenticate, requireActiveSubscription, getProductDetails); // All
router.post('/', authenticate, requireActiveSubscription, authorize(['admin']), createProduct); // Admin
router.patch('/:id', authenticate, requireActiveSubscription, authorize(['manager', 'admin']), updateProduct); // Manager+
router.delete('/:id', authenticate, requireActiveSubscription, authorize(['admin']), deleteProduct); // Admin

export default router;
