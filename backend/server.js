const express = require('express');
const mongoose = require('mongoose');

// Middlewares
const {
  securityMiddleware,
  httpLogger,
  requestLogger,
  generalRateLimiter,
  requestTimeMiddleware,
  sanitizeMiddleware,
  errorHandler,
  notFoundMiddleware
} = require('./src/middlewares');

// Routes
const routes = require('./src/routes');

const app = express();

// Middlewares globais
app.use(securityMiddleware);
app.use(httpLogger);
app.use(requestLogger);
app.use(generalRateLimiter);
app.use(requestTimeMiddleware);
app.use(sanitizeMiddleware);
app.use(express.json());

// Rotas
app.use('/api', routes);

// Error handlers (devem ser os últimos)
app.use(notFoundMiddleware);
app.use(errorHandler);

// Health check básico
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Apenas para testes - não iniciar servidor se importado
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/etchi')
    .then(() => {
      console.log('✅ Conectado ao MongoDB');
      app.listen(PORT, () => {
        console.log(`🚀 Servidor rodando na porta ${PORT}`);
      });
    })
    .catch(error => {
      console.error('❌ Erro ao conectar MongoDB:', error);
      process.exit(1);
    });
}

module.exports = app;