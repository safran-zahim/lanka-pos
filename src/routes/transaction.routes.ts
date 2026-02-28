import express from 'express';
import { getTransactions } from '../controllers/transaction.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/', authenticate, getTransactions);

export default router;
