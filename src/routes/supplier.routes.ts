import { Router } from 'express';
import {
    getSuppliers,
    getSupplierById,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    createPurchase,
} from '../controllers/supplierController';
import { authenticate, requireActiveSubscription } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, requireActiveSubscription, getSuppliers);
router.get('/:id', authenticate, requireActiveSubscription, getSupplierById);
router.post('/', authenticate, requireActiveSubscription, createSupplier);
router.patch('/:id', authenticate, requireActiveSubscription, updateSupplier);
router.put('/:id', authenticate, requireActiveSubscription, updateSupplier);
router.delete('/:id', authenticate, requireActiveSubscription, deleteSupplier);
router.post('/:id/purchase', authenticate, requireActiveSubscription, createPurchase);

export default router;
