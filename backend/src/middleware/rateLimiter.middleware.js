// src/middlewares/rateLimiter.middleware.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

// Configuração do cliente Redis (se disponível)
let redisClient;
if (process.env.REDIS_URL) {
  redisClient = redis.createClient({
    url: process.env.REDIS_URL
  });
  redisClient.connect().catch(console.error);
}

/**
 * @middleware generalRateLimiter
 * @description Rate limiting geral para toda a API
 * @module middlewares/rateLimiter
 */
const generalRateLimiter = rateLimit({
  store: redisClient ? new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }) : undefined,
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo de 100 requests por IP
  message: {
    success: false,
    message: 'Muitas requisições. Tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    return req.user ? req.user.id : req.ip; // Usar user ID se autenticado, senão IP
  }
});

/**
 * @middleware authRateLimiter
 * @description Rate limiting mais restritivo para rotas de autenticação
 * @module middlewares/rateLimiter
 */
const authRateLimiter = rateLimit({
  store: redisClient ? new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }) : undefined,
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // apenas 5 tentativas de login
  message: {
    success: false,
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Não contar requests bem-sucedidos
});

/**
 * @middleware sensitiveActionRateLimiter
 * @description Rate limiting para ações sensíveis (mudança de senha, etc.)
 * @module middlewares/rateLimiter
 */
const sensitiveActionRateLimiter = rateLimit({
  store: redisClient ? new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }) : undefined,
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // apenas 3 tentativas por hora
  message: {
    success: false,
    message: 'Muitas tentativas. Tente novamente em 1 hora.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * @middleware apiRateLimiter
 * @description Rate limiting para API baseado em planos (futuro)
 * @module middlewares/rateLimiter
 */
const apiRateLimiter = (maxRequests = 1000, windowMs = 15 * 60 * 1000) => {
  return rateLimit({
    store: redisClient ? new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
    }) : undefined,
    windowMs,
    max: maxRequests,
    message: {
      success: false,
      message: `Limite de requisições excedido. Plano: ${maxRequests} req/15min`
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user ? req.user.id : req.ip
  });
};

module.exports = {
  generalRateLimiter,
  authRateLimiter,
  sensitiveActionRateLimiter,
  apiRateLimiter
};