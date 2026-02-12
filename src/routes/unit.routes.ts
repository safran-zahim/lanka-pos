import { Router } from 'express';
import * as unitController from '../controllers/unit.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, unitController.createUnit);
router.get('/', authenticate, unitController.getUnits);
router.patch('/:id', authenticate, unitController.updateUnit);
router.delete('/:id', authenticate, unitController.deleteUnit);

export default router;
