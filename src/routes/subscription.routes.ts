import { Router } from 'express';
import { authenticate, authorize, requireActiveSubscription } from '../middleware/auth.middleware';
import { getSubscriptionStatus, updateSubscriptionStatus, createPlan, getPlans, updatePlan } from '../controllers/subscription.controller';

const router = Router();

router.get('/status', authenticate, requireActiveSubscription, getSubscriptionStatus);
router.patch('/status', authenticate, authorize(['super_admin']), updateSubscriptionStatus);

router.post('/plans', authenticate, authorize(['super_admin']), createPlan);
router.get('/plans', authenticate, authorize(['super_admin']), getPlans);
router.patch('/plans/:id', authenticate, authorize(['super_admin']), updatePlan);
router.put('/plans/:id', authenticate, authorize(['super_admin']), updatePlan);

export default router;
