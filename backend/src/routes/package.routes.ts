// src/routes/package.routes.ts
import express from 'express';
import { packageController } from '../controllers/Package.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';

const router = express.Router();

router.use(authMiddleware);

router.post('/', packageController.createPackage);
router.get('/available', packageController.getAvailablePackages);
router.get('/my-packages', packageController.getMyPackages);
router.post('/:packageId/offer', packageController.makeOffer);
router.post('/:packageId/accept-offer', packageController.acceptOffer);
router.put('/:packageId/status', packageController.updateStatus);

export default router;