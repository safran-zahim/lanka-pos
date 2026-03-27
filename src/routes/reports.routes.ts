import { Router } from 'express';
import { getDashboardInsights, getShiftReconciliation } from '../controllers/reports.controller';
import { authenticate, authorize, requireActiveSubscription } from '../middleware/auth.middleware';

const router = Router();

router.get('/dashboard', authenticate, requireActiveSubscription, authorize(['manager', 'admin']), getDashboardInsights);
router.get('/reconciliation', authenticate, requireActiveSubscription, authorize(['manager', 'admin']), getShiftReconciliation);

export default router;
