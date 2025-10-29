// src/routes/index.js
const express = require('express');
const router = express.Router();

// Importar todas as rotas
const authRoutes = require('./auth.routes');
const userRoutes = require('./users.routes');
const addressRoutes = require('./addresses.routes');
const deliveryRoutes = require('./deliveries.routes');
const transactionRoutes = require('./transactions.routes');
const smartPointRoutes = require('./smartpoints.routes');
const notificationRoutes = require('./notifications.routes');
const supportRoutes = require('./support.routes');
const reviewRoutes = require('./reviews.routes');
const analyticsRoutes = require('./analytics.routes');

// Configurar Swagger
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Etchi API - Entregas Colaborativas',
      version: '1.0.0',
      description: 'API para sistema de entregas colaborativas Etchi',
      contact: {
        name: 'Suporte Etchi',
        email: 'suporte@etchi.ao'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000/api',
        description: 'Servidor API'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Rotas da API
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/addresses', addressRoutes);
router.use('/deliveries', deliveryRoutes);
router.use('/transactions', transactionRoutes);
router.use('/smartpoints', smartPointRoutes);
router.use('/notifications', notificationRoutes);
router.use('/support', supportRoutes);
router.use('/reviews', reviewRoutes);
router.use('/analytics', analyticsRoutes);

// Documentação Swagger
router.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rota de saúde da API
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API Etchi está funcionando corretamente',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Rota 404 para endpoints não encontrados
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Rota não encontrada: ${req.originalUrl}`
  });
});

module.exports = router;