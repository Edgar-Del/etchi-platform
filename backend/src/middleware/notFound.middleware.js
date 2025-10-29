// src/middlewares/notFound.middleware.js
/**
 * @middleware notFoundMiddleware
 * @description Middleware para tratar rotas não encontradas (404)
 * @module middlewares/notFound
 */
const notFoundMiddleware = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Rota não encontrada: ${req.method} ${req.originalUrl}`,
    suggestion: 'Verifique a documentação da API em /api/docs',
    timestamp: new Date().toISOString()
  });
};

/**
 * @middleware methodNotAllowed
 * @description Middleware para tratar métodos não permitidos (405)
 * @module middlewares/notFound
 */
const methodNotAllowed = (req, res, next) => {
  res.status(405).json({
    success: false,
    message: `Método não permitido: ${req.method} para ${req.originalUrl}`,
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // Ajustar conforme necessário
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  notFoundMiddleware,
  methodNotAllowed
};