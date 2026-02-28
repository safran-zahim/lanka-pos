import express from 'express';
import { getExpenses, createExpense, getExpenseById, getExpenseCategories, createExpenseCategory } from '../controllers/expense.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// Categories
router.get('/categories', authenticate, getExpenseCategories);
router.post('/categories', authenticate, createExpenseCategory);

// Expenses
router.get('/', authenticate, getExpenses);
router.post('/', authenticate, createExpense);
router.get('/:id', authenticate, getExpenseById);

export default router;
