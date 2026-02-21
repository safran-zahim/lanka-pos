import { Router } from 'express';
import { 
    createCategory, 
    deleteCategory, 
    getCategories, 
    updateCategory,
    createSubCategory,
    getSubCategories,
    updateSubCategory,
    deleteSubCategory
} from '../controllers/category.controller';
import { authenticate, authorize, requireActiveSubscription } from '../middleware/auth.middleware';

const router = Router();

// Category routes
router.post('/', authenticate, requireActiveSubscription, authorize(['admin', 'super_admin']), createCategory);
router.get('/', authenticate, requireActiveSubscription, getCategories);
router.patch('/:id', authenticate, requireActiveSubscription, authorize(['admin', 'manager']), updateCategory);
router.delete('/:id', authenticate, requireActiveSubscription, authorize(['admin', 'super_admin']), deleteCategory);

// SubCategory routes
router.post('/subcategories', authenticate, requireActiveSubscription, authorize(['admin', 'super_admin']), createSubCategory);
router.get('/subcategories/:categoryId?', authenticate, requireActiveSubscription, getSubCategories);
router.patch('/subcategories/:id', authenticate, requireActiveSubscription, authorize(['admin', 'manager']), updateSubCategory);
router.delete('/subcategories/:id', authenticate, requireActiveSubscription, authorize(['admin', 'super_admin']), deleteSubCategory);

export default router;
