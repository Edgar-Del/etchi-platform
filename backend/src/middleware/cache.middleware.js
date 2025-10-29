// src/middlewares/cache.middleware.js
const NodeCache = require('node-cache');

// Criar instância do cache
const cache = new NodeCache({
  stdTTL: 60, // TTL padrão de 60 segundos
  checkperiod: 120, // Verificar expirações a cada 120 segundos
  useClones: false // Melhor performance
});

/**
 * @middleware cacheMiddleware
 * @description Middleware de cache para respostas GET
 * @param {string} keyPrefix - Prefixo para a chave do cache
 * @param {number} duration - Duração do cache em segundos
 * @module middlewares/cache
 */
const cacheMiddleware = (keyPrefix = 'api', duration = 60) => {
  return (req, res, next) => {
    // Apenas cache para métodos GET
    if (req.method !== 'GET') {
      return next();
    }

    // Gerar chave única baseada na URL e parâmetros
    const cacheKey = `${keyPrefix}:${req.originalUrl}`;

    // Tentar obter do cache
    const cachedResponse = cache.get(cacheKey);
    
    if (cachedResponse) {
      console.log(`💾 Cache hit: ${cacheKey}`);
      
      // Adicionar header indicando que veio do cache
      res.set('X-Cache', 'HIT');
      
      return res.json(cachedResponse);
    }

    // Interceptar resposta para armazenar no cache
    const originalSend = res.send;
    
    res.send = function(body) {
      // Apenas cache respostas bem-sucedidas
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const responseBody = JSON.parse(body);
          
          // Armazenar no cache
          cache.set(cacheKey, responseBody, duration);
          console.log(`💾 Cache set: ${cacheKey} (${duration}s)`);
          
          // Adicionar header
          res.set('X-Cache', 'MISS');
        } catch (error) {
          console.error('Erro ao fazer parse da resposta para cache:', error);
        }
      }
      
      originalSend.call(this, body);
    };

    next();
  };
};

/**
 * @function clearCache
 * @description Limpa cache por padrão ou chave específica
 */
const clearCache = (pattern = null) => {
  if (!pattern) {
    cache.flushAll();
    console.log('🗑️  Todo o cache foi limpo');
    return;
  }

  const keys = cache.keys();
  const keysToDelete = keys.filter(key => key.includes(pattern));
  
  cache.del(keysToDelete);
  console.log(`🗑️  Cache limpo para padrão: ${pattern} (${keysToDelete.length} chaves)`);
};

/**
 * @function getCacheStats
 * @description Retorna estatísticas do cache
 */
const getCacheStats = () => {
  return cache.getStats();
};

/**
 * @middleware cacheControl
 * @description Middleware para headers de controle de cache
 */
const cacheControl = (maxAge = 60) => {
  return (req, res, next) => {
    if (req.method === 'GET') {
      res.set('Cache-Control', `public, max-age=${maxAge}`);
    } else {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    }
    next();
  };
};

module.exports = {
  cacheMiddleware,
  clearCache,
  getCacheStats,
  cacheControl,
  cache // Exportar instância para uso direto quando necessário
};