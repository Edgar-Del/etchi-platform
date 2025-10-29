// src/middlewares/error.middleware.js
const mongoose = require('mongoose');

/**
 * @class AppError
 * @description Classe personalizada para erros da aplicação
 * @extends Error
 */
class AppError extends Error {
  constructor(message, statusCode, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * @middleware errorHandler
 * @description Middleware centralizado de tratamento de erros
 * @module middlewares/error
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log do erro
  console.error('🚨 Erro capturado:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    user: req.user ? req.user.id : 'Não autenticado',
    timestamp: new Date().toISOString()
  });

  // Erro de validação do Mongoose
  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map(val => ({
      field: val.path,
      message: val.message
    }));

    error = new AppError('Dados de entrada inválidos', 400, errors);
  }

  // Erro de CastError (ID inválido)
  if (err instanceof mongoose.Error.CastError) {
    error = new AppError('Recurso não encontrado', 404);
  }

  // Erro de duplicata (código 11000 do MongoDB)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = new AppError(`${field} já está em uso`, 400);
  }

  // Erro JWT
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Token inválido', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expirado', 401);
  }

  // Resposta de erro padronizada
  const response = {
    success: false,
    message: error.message || 'Erro interno do servidor',
    ...(error.details && { details: error.details }),
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      error: error.name
    })
  };

  res.status(error.statusCode || 500).json(response);
};

/**
 * @middleware asyncErrorHandler
 * @description Wrapper para lidar com erros em funções assíncronas
 * @param {Function} fn - Função assíncrona
 * @returns {Function} Função com tratamento de erro
 * @module middlewares/error
 */
const asyncErrorHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * @function createError
 * @description Factory function para criar erros personalizados
 * @param {string} message - Mensagem de erro
 * @param {number} statusCode - Código HTTP
 * @param {any} details - Detalhes adicionais
 * @returns {AppError} Instância de AppError
 */
const createError = (message, statusCode = 500, details = null) => {
  return new AppError(message, statusCode, details);
};

module.exports = {
  errorHandler,
  asyncErrorHandler,
  createError,
  AppError
};