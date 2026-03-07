import { Router } from 'express';
import { bulkImportProducts, bulkImportCustomers, bulkExportProducts } from '../controllers/bulkController';

const router = Router();

router.get('/products/export', bulkExportProducts);
router.post('/products', bulkImportProducts);
router.post('/customers', bulkImportCustomers);

export default router;
