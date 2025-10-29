// src/middlewares/sanitize.middleware.js
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');

/**
 * @middleware sanitizeMiddleware
 * @description Middleware de sanitização para prevenir ataques de injeção
 * @module middlewares/sanitize
 */
const sanitizeMiddleware = [
  // Sanitização MongoDB - Prevenir NoSQL injection
  mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      console.warn(`🚨 Tentativa de injeção NoSQL detectada:`, {
        key,
        value: req.body[key],
        ip: req.ip,
        url: req.originalUrl,
        timestamp: new Date().toISOString()
      });
    }
  }),

  // Sanitização customizada de dados
  (req, res, next) => {
    // Sanitizar body
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }
    
    // Sanitizar query parameters
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }
    
    // Sanitizar params
    if (req.params) {
      req.params = sanitizeObject(req.params);
    }
    
    next();
  }
];

/**
 * @function sanitizeObject
 * @description Sanitiza recursivamente um objeto
 */
function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return typeof obj === 'string' ? xss(obj.trim()) : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = xss(value.trim());
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * @function sanitizeEmail
 * @description Sanitização específica para emails
 */
const sanitizeEmail = (email) => {
  return email ? email.toLowerCase().trim() : email;
};

/**
 * @function sanitizePhone
 * @description Sanitização específica para números de telefone
 */
const sanitizePhone = (phone) => {
  return phone ? phone.replace(/\D/g, '') : phone;
};

/**
 * @function sanitizeText
 * @description Sanitização específica para textos
 */
const sanitizeText = (text) => {
  if (!text) return text;
  
  // Remover tags HTML e limitar comprimento
  return xss(text)
    .replace(/<[^>]*>/g, '')
    .substring(0, 1000); // Limite de 1000 caracteres
};

module.exports = {
  sanitizeMiddleware,
  sanitizeObject,
  sanitizeEmail,
  sanitizePhone,
  sanitizeText
};