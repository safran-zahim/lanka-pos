import express from 'express';
import { openShift, getActiveShift, closeShift, getShiftReport, addPettyCash, getLastClosedShift } from '../controllers/shift.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

router.post('/open', authenticate, openShift);
router.get('/active', authenticate, getActiveShift);
router.post('/close', authenticate, closeShift);
router.get('/last-closed', authenticate, getLastClosedShift);
router.get('/:id/report', authenticate, getShiftReport);
router.post('/petty-cash', authenticate, addPettyCash);

export default router;
