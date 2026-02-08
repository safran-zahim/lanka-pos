import { Router } from 'express';
import { checkout, getSale, refundSale, getDailySummary } from '../controllers/sales.controller';
import { authenticate, authorize, requireActiveSubscription } from '../middleware/auth.middleware';

const router = Router();

router.post('/checkout', authenticate, requireActiveSubscription, authorize(['cashier', 'manager', 'admin']), checkout); // Cashier+
router.get('/daily-summary', authenticate, requireActiveSubscription, authorize(['manager', 'admin']), getDailySummary); // Manager+
router.get('/:id', authenticate, requireActiveSubscription, getSale); // All (authenticated)
router.post('/:id/refund', authenticate, requireActiveSubscription, authorize(['manager', 'admin']), refundSale); // Manager+

export default router;
