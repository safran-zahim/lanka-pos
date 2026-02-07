import { Router } from 'express';
import { checkout, getSale, refundSale, getDailySummary } from '../controllers/sales.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.post('/checkout', authenticate, authorize(['cashier', 'manager', 'admin']), checkout); // Cashier+
router.get('/daily-summary', authenticate, authorize(['manager', 'admin']), getDailySummary); // Manager+
router.get('/:id', authenticate, getSale); // All (authenticated)
router.post('/:id/refund', authenticate, authorize(['manager', 'admin']), refundSale); // Manager+

export default router;
