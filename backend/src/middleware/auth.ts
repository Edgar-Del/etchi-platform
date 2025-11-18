// src/middleware/auth.ts
import { authMiddleware as authenticateJWT, requireUserType as authorizeRoles } from './auth.middleware';

module.exports = {
  authenticateJWT,
  authorizeRoles,
};

