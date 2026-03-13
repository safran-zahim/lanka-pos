import { Router } from 'express';
import { checkout, createHeldSale, deleteHeldSale, getHeldSales, getSale, getSales, refundSale, getDailySummary, getMonthlySummary, updateSaleNote } from '../controllers/sales.controller';
import { authenticate, authorize, requireActiveSubscription } from '../middleware/auth.middleware';

const router = Router();

router.post('/checkout', authenticate, requireActiveSubscription, authorize(['cashier', 'manager', 'admin']), checkout); // Cashier+
router.get('/', authenticate, requireActiveSubscription, authorize(['cashier', 'manager', 'admin']), getSales); // Cashier+
router.get('/daily-summary', authenticate, requireActiveSubscription, authorize(['manager', 'admin']), getDailySummary); // Manager+
router.get('/monthly-summary', authenticate, requireActiveSubscription, authorize(['manager', 'admin']), getMonthlySummary); // Manager+
router.get('/held', authenticate, requireActiveSubscription, authorize(['cashier', 'manager', 'admin']), getHeldSales); // Cashier+
router.post('/held', authenticate, requireActiveSubscription, authorize(['cashier', 'manager', 'admin']), createHeldSale); // Cashier+
router.delete('/held/:id', authenticate, requireActiveSubscription, authorize(['cashier', 'manager', 'admin']), deleteHeldSale); // Cashier+
router.get('/:id', authenticate, requireActiveSubscription, getSale); // All (authenticated)
router.post('/:id/refund', authenticate, requireActiveSubscription, authorize(['manager', 'admin']), refundSale); // Manager+
router.patch('/:id/note', authenticate, requireActiveSubscription, authorize(['manager', 'admin']), updateSaleNote); // Manager+

export default router;
