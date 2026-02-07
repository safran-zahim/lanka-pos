import { Router } from 'express';
import { getPerformance, clockIn } from '../controllers/staff.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Manager+ for performance
router.get('/performance', authenticate, authorize(['manager', 'admin']), getPerformance);

// All allowed for clock-in (but maybe only for themselves? keeping it simple for now)
router.post('/clock-in', authenticate, clockIn);

export default router;
