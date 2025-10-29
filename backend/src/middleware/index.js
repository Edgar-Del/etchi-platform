// src/middlewares/index.js
// Exportar todos os middlewares de uma vez

// Autenticação e Autorização
const { authenticateJWT, authorizeRoles, optionalAuth } = require('./auth.middleware');

// Tratamento de Erros
const { errorHandler, asyncErrorHandler, createError } = require('./error.middleware');

// Validação
const { 
  handleValidationErrors, 
  userValidation, 
  deliveryValidation,
  addressValidation,
  idValidation,
  paginationValidation,
  validation 
} = require('./validation.middleware');

// Logging
const { httpLogger, requestLogger, logError, logInfo } = require('./logger.middleware');

// Segurança
const { securityMiddleware, noCache, securityHeaders } = require('./security.middleware');

// Rate Limiting
const { 
  generalRateLimiter, 
  authRateLimiter, 
  sensitiveActionRateLimiter,
  apiRateLimiter 
} = require('./rateLimiter.middleware');

// Upload
const { 
  uploadMiddleware, 
  singleUpload, 
  multipleUpload, 
  imageUpload, 
  documentUpload,
  deleteFile 
} = require('./upload.middleware');

// Performance
const { requestTimeMiddleware, responseTimeHeader } = require('./requestTime.middleware');

// Sanitização
const { 
  sanitizeMiddleware, 
  sanitizeObject, 
  sanitizeEmail, 
  sanitizePhone, 
  sanitizeText 
} = require('./sanitize.middleware');

// Cache
const { 
  cacheMiddleware, 
  clearCache, 
  getCacheStats, 
  cacheControl 
} = require('./cache.middleware');

// Not Found
const { notFoundMiddleware, methodNotAllowed } = require('./notFound.middleware');

module.exports = {
  // Autenticação
  authenticateJWT,
  authorizeRoles,
  optionalAuth,
  
  // Erros
  errorHandler,
  asyncErrorHandler,
  createError,
  
  // Validação
  handleValidationErrors,
  userValidation,
  deliveryValidation,
  addressValidation,
  idValidation,
  paginationValidation,
  validation,
  
  // Logging
  httpLogger,
  requestLogger,
  logError,
  logInfo,
  
  // Segurança
  securityMiddleware,
  noCache,
  securityHeaders,
  
  // Rate Limiting
  generalRateLimiter,
  authRateLimiter,
  sensitiveActionRateLimiter,
  apiRateLimiter,
  
  // Upload
  uploadMiddleware,
  singleUpload,
  multipleUpload,
  imageUpload,
  documentUpload,
  deleteFile,
  
  // Performance
  requestTimeMiddleware,
  responseTimeHeader,
  
  // Sanitização
  sanitizeMiddleware,
  sanitizeObject,
  sanitizeEmail,
  sanitizePhone,
  sanitizeText,
  
  // Cache
  cacheMiddleware,
  clearCache,
  getCacheStats,
  cacheControl,
  
  // Not Found
  notFoundMiddleware,
  methodNotAllowed
};