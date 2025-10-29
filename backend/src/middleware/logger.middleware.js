// src/middlewares/logger.middleware.js
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

// Garantir que o diretório de logs existe
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * @function formatLogMessage
 * @description Formata mensagem de log estruturada
 */
const formatLogMessage = (tokens, req, res) => {
  const logData = {
    timestamp: new Date().toISOString(),
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: tokens.status(req, res),
    response_time: `${tokens['response-time'](req, res)} ms`,
    content_length: tokens.res(req, res, 'content-length'),
    user_agent: tokens['user-agent'](req, res),
    ip: req.ip || req.connection.remoteAddress,
    user: req.user ? req.user.id : 'anonymous'
  };

  return JSON.stringify(logData);
};

/**
 * @middleware httpLogger
 * @description Middleware de logging HTTP usando Morgan com formato JSON
 * @module middlewares/logger
 */
const httpLogger = morgan(formatLogMessage, {
  stream: {
    write: (message) => {
      const logData = JSON.parse(message);
      
      // Log para console em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log(`📝 ${logData.method} ${logData.url} - ${logData.status} - ${logData.response_time}`);
      }

      // Log para arquivo
      const logStream = fs.createWriteStream(
        path.join(logsDir, 'http.log'), 
        { flags: 'a' }
      );
      logStream.write(message + '\n');
    }
  }
});

/**
 * @middleware requestLogger
 * @description Middleware customizado para logging de requests
 * @module middlewares/logger
 */
const requestLogger = (req, res, next) => {
  req.requestId = generateRequestId();
  req.startTime = Date.now();

  // Log de request recebido
  console.log(`➡️  REQUEST [${req.requestId}]`, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    user: req.user ? req.user.id : 'Não autenticado',
    timestamp: new Date().toISOString()
  });

  // Interceptar resposta para logging
  const originalSend = res.send;
  res.send = function(data) {
    const responseTime = Date.now() - req.startTime;
    
    console.log(`⬅️  RESPONSE [${req.requestId}]`, {
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      contentLength: res.get('Content-Length'),
      timestamp: new Date().toISOString()
    });

    // Log de erros
    if (res.statusCode >= 400) {
      const errorStream = fs.createWriteStream(
        path.join(logsDir, 'error.log'), 
        { flags: 'a' }
      );
      
      errorStream.write(JSON.stringify({
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        ip: req.ip,
        user: req.user ? req.user.id : 'anonymous',
        error: data
      }) + '\n');
    }

    originalSend.call(this, data);
  };

  next();
};

/**
 * @function generateRequestId
 * @description Gera ID único para rastreamento de requests
 */
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * @function logError
 * @description Função para logging estruturado de erros
 */
const logError = (error, context = {}) => {
  const errorLog = {
    level: 'ERROR',
    timestamp: new Date().toISOString(),
    message: error.message,
    stack: error.stack,
    ...context
  };

  // Console em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    console.error('🚨 ERRO:', errorLog);
  }

  // Arquivo de erros
  const errorStream = fs.createWriteStream(
    path.join(logsDir, 'application-errors.log'), 
    { flags: 'a' }
  );
  errorStream.write(JSON.stringify(errorLog) + '\n');
};

/**
 * @function logInfo
 * @description Função para logging estruturado de informações
 */
const logInfo = (message, context = {}) => {
  const infoLog = {
    level: 'INFO',
    timestamp: new Date().toISOString(),
    message,
    ...context
  };

  // Console em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    console.log('ℹ️  INFO:', infoLog);
  }

  // Arquivo de informações
  const infoStream = fs.createWriteStream(
    path.join(logsDir, 'application.log'), 
    { flags: 'a' }
  );
  infoStream.write(JSON.stringify(infoLog) + '\n');
};

module.exports = {
  httpLogger,
  requestLogger,
  logError,
  logInfo
};