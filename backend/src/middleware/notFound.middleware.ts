// src/middleware/notFound.middleware.ts
import { Request, Response, NextFunction } from 'express';

export const notFoundMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    message: `Rota não encontrada: ${req.originalUrl}`,
  });
};

