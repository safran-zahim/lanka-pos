import { Router } from 'express';
import { authenticate, authorize, requireActiveSubscription } from '../middleware/auth.middleware';
import { getSubscriptionStatus, updateSubscriptionStatus } from '../controllers/subscription.controller';

const router = Router();

router.get('/status', authenticate, requireActiveSubscription, getSubscriptionStatus);
router.patch('/status', authenticate, authorize(['admin']), updateSubscriptionStatus);

export default router;
