import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { getSubscriptionStatus, updateSubscriptionStatus, getSubscriptionHistory } from '../controllers/subscription.controller';

const router = Router();

// Status — all authenticated users can read (used by Dashboard + POS banner)
router.get('/status', authenticate, getSubscriptionStatus);

// Update — super_admin only
router.patch('/status', authenticate, authorize(['super_admin']), updateSubscriptionStatus);

// History — all authenticated users can read (admin/manager view on Subscription Status page)
router.get('/history', authenticate, getSubscriptionHistory);

export default router;
