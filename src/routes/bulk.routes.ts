import { Router } from 'express';
import { bulkImportProducts, bulkImportCustomers, bulkExportProducts, bulkUpdateProductStatus } from '../controllers/bulkController';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/products/export', authenticate, authorize(['admin']), bulkExportProducts);
router.post('/products', authenticate, authorize(['admin']), bulkImportProducts);
router.post('/customers', authenticate, authorize(['admin']), bulkImportCustomers);
router.patch('/products/status', authenticate, authorize(['admin']), bulkUpdateProductStatus);

export default router;
