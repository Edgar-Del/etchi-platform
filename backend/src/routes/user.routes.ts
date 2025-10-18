// src/routes/user.routes.ts
import express from 'express';
import { userController } from '../controllers/User.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

router.use(authMiddleware);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.put('/location', userController.updateLocation);
router.put('/availability', userController.updateAvailability);

export default router;