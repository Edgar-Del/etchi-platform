// src/middlewares/security.middleware.js
const helmet = require('helmet');
const cors = require('cors');
const xss = require('xss-clean');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');

/**
 * @middleware securityMiddleware
 * @description Middleware de segurança que aplica várias camadas de proteção
 * @module middlewares/security
 */
const securityMiddleware = [
  // Helmet - Headers de segurança
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false
  }),

  // CORS - Cross-Origin Resource Sharing
  cors({
    origin: function (origin, callback) {
      // Permitir requests sem origin (mobile apps, postman, etc)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = process.env.ALLOWED_ORIGINS 
        ? process.env.ALLOWED_ORIGINS.split(',') 
        : [
            'http://localhost:3000',
            'http://localhost:3001',
            'https://etchi.ao',
            'https://www.etchi.ao'
          ];

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Não permitido por CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin'
    ]
  }),

  // XSS Clean - Prevenção contra XSS
  xss(),

  // HPP - Prevenção contra Parameter Pollution
  hpp({
    whitelist: [
      'page',
      'limit',
      'sort',
      'fields',
      'lng',
      'lat',
      'radius'
    ]
  }),

  // Rate Limiting básico
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // limite de 100 requests por IP
    message: {
      success: false,
      message: 'Muitas requisições deste IP. Tente novamente em 15 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false
  })
];

/**
 * @middleware noCache
 * @description Middleware para prevenir caching de responses sensíveis
 * @module middlewares/security
 */
const noCache = (req, res, next) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store'
  });
  next();
};

/**
 * @middleware securityHeaders
 * @description Headers de segurança adicionais
 * @module middlewares/security
 */
const securityHeaders = (req, res, next) => {
  // Prevenir clickjacking
  res.set('X-Frame-Options', 'DENY');
  
  // Prevenir MIME type sniffing
  res.set('X-Content-Type-Options', 'nosniff');
  
  // Referrer Policy
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  res.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Remover header X-Powered-By
  res.removeHeader('X-Powered-By');
  
  next();
};

module.exports = {
  securityMiddleware,
  noCache,
  securityHeaders
};