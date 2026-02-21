import { Router } from 'express';
import { authenticate, authorize, requireActiveSubscription } from '../middleware/auth.middleware';
import { getSettings, updateSetting } from '../controllers/settings.controller';

const router = Router();

router.get('/', authenticate, requireActiveSubscription, authorize(['manager', 'admin']), getSettings);
router.put('/:key', authenticate, requireActiveSubscription, authorize(['manager', 'admin']), updateSetting);

export default router;
