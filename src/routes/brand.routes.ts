import { Router } from 'express';
import * as brandController from '../controllers/brand.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, brandController.createBrand);
router.get('/', authenticate, brandController.getBrands);
router.patch('/:id', authenticate, brandController.updateBrand);
router.delete('/:id', authenticate, brandController.deleteBrand);

export default router;
