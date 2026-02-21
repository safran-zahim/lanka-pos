import { Router } from 'express';
import { clockIn, createStaff, deleteStaff, getPerformance, getStaffList, resetStaffPassword, updateStaff } from '../controllers/staff.controller';
import { authenticate, authorize, requireActiveSubscription } from '../middleware/auth.middleware';

const router = Router();

// Manager+ for performance
router.get('/performance', authenticate, requireActiveSubscription, authorize(['manager', 'admin']), getPerformance);

// All allowed for clock-in (but maybe only for themselves? keeping it simple for now)
router.post('/clock-in', authenticate, requireActiveSubscription, clockIn);

// Staff management
router.get('/', authenticate, requireActiveSubscription, authorize(['admin', 'manager']), getStaffList);
router.post('/', authenticate, requireActiveSubscription, authorize(['admin']), createStaff);
router.patch('/:id', authenticate, requireActiveSubscription, authorize(['admin', 'manager']), updateStaff);
router.delete('/:id', authenticate, requireActiveSubscription, authorize(['admin']), deleteStaff);
router.patch('/:id/password', authenticate, requireActiveSubscription, authorize(['admin']), resetStaffPassword);

export default router;
