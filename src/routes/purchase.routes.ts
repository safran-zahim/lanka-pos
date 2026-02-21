import { Router } from 'express';
import { authenticate, authorize, requireActiveSubscription } from '../middleware/auth.middleware';
import { addPurchasePayment, createPurchase, getPurchaseById, getPurchases } from '../controllers/purchase.controller';

const router = Router();

router.get('/', authenticate, requireActiveSubscription, authorize(['manager', 'admin']), getPurchases);
router.get('/:id', authenticate, requireActiveSubscription, authorize(['manager', 'admin']), getPurchaseById);
router.post('/', authenticate, requireActiveSubscription, authorize(['manager', 'admin']), createPurchase);
router.post('/:id/payments', authenticate, requireActiveSubscription, authorize(['manager', 'admin']), addPurchasePayment);

export default router;
