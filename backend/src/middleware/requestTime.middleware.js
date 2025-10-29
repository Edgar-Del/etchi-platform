// src/middlewares/requestTime.middleware.js
/**
 * @middleware requestTimeMiddleware
 * @description Middleware que adiciona timestamp da requisição e mede tempo de resposta
 * @module middlewares/requestTime
 */
const requestTimeMiddleware = (req, res, next) => {
  // Timestamp de início da requisição
  req.requestStartTime = Date.now();
  req.requestTimestamp = new Date().toISOString();
  
  // Interceptar o método 'end' para calcular tempo total
  const originalEnd = res.end;
  
  res.end = function(chunk, encoding) {
    const responseTime = Date.now() - req.requestStartTime;
    
    // Adicionar header com tempo de resposta
    res.setHeader('X-Response-Time', `${responseTime}ms`);
    
    // Log de performance se for lento
    if (responseTime > 1000) { // Mais de 1 segundo
      console.warn(`⚠️  Requisição lenta: ${req.method} ${req.originalUrl} - ${responseTime}ms`);
    }
    
    // Restaurar método original
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

/**
 * @middleware responseTimeHeader
 * @description Adiciona header com tempo de resposta
 * @module middlewares/requestTime
 */
const responseTimeHeader = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    res.setHeader('X-Response-Time', `${duration}ms`);
  });
  
  next();
};

module.exports = {
  requestTimeMiddleware,
  responseTimeHeader
};