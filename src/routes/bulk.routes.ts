import { Router } from 'express';
import { bulkImportProducts, bulkImportCustomers } from '../controllers/bulkController';

const router = Router();

router.post('/products', bulkImportProducts);
router.post('/customers', bulkImportCustomers);

export default router;
