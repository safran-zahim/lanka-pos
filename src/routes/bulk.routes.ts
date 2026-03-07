import { Router } from 'express';
import { bulkImportProducts, bulkImportCustomers, bulkExportProducts, bulkUpdateProductStatus } from '../controllers/bulkController';

const router = Router();

router.get('/products/export', bulkExportProducts);
router.post('/products', bulkImportProducts);
router.post('/customers', bulkImportCustomers);
router.patch('/products/status', bulkUpdateProductStatus);

export default router;
