// src/middleware/notFound.middleware.ts
import { Request, Response, NextFunction } from 'express';

export const notFoundMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const originalUrl = req.originalUrl;
  
  // Detectar duplicação de /api
  if (originalUrl.includes('/api/api/')) {
    const correctedUrl = originalUrl.replace('/api/api/', '/api/');
    res.status(404).json({
      success: false,
      message: `Rota não encontrada: ${originalUrl}`,
      suggestion: `Você está usando uma URL duplicada. Tente: ${correctedUrl}`,
      hint: 'Verifique se sua base URL já inclui "/api" e não adicione novamente nas rotas'
    });
    return;
  }
  
  res.status(404).json({
    success: false,
    message: `Rota não encontrada: ${originalUrl}`,
    availableRoutes: [
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/auth/me',
      'GET /api/health'
    ]
  });
};

