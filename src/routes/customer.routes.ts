import { Router } from 'express';
import {
	getCustomers,
	createCustomer,
	getCustomerHistory,
	getCustomerDetails,
	updateCustomer,
	deleteCustomer,
	getCustomerPointsHistory
} from '../controllers/customer.controller';
import { authenticate, requireActiveSubscription } from '../middleware/auth.middleware';

const router = Router();

// "Cashier+" for all
router.get('/', authenticate, requireActiveSubscription, getCustomers);
router.post('/', authenticate, requireActiveSubscription, createCustomer);
router.get('/:id', authenticate, requireActiveSubscription, getCustomerDetails);
router.patch('/:id', authenticate, requireActiveSubscription, updateCustomer);
router.delete('/:id', authenticate, requireActiveSubscription, deleteCustomer);
router.get('/:id/points', authenticate, requireActiveSubscription, getCustomerPointsHistory);
router.get('/:id/history', authenticate, requireActiveSubscription, getCustomerHistory);

export default router;
