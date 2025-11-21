// src/middleware/auth.ts
import { authMiddleware, requireUserType } from './auth.middleware';

export const authenticateJWT = authMiddleware;
export const authorizeRoles = requireUserType;

