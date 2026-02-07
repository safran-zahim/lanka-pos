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
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// "Cashier+" for all
router.get('/', authenticate, getCustomers);
router.post('/', authenticate, createCustomer);
router.get('/:id', authenticate, getCustomerDetails);
router.patch('/:id', authenticate, updateCustomer);
router.delete('/:id', authenticate, deleteCustomer);
router.get('/:id/points', authenticate, getCustomerPointsHistory);
router.get('/:id/history', authenticate, getCustomerHistory);

export default router;
