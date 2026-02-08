import { Router } from 'express';
import { createCategory, getCategories, deleteCategory } from '../controllers/category.controller';
import { authenticate, requireActiveSubscription } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, requireActiveSubscription, createCategory);
router.get('/', authenticate, requireActiveSubscription, getCategories);
router.delete('/:id', authenticate, requireActiveSubscription, deleteCategory);

export default router;
