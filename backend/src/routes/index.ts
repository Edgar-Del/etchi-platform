// src/routes/index.ts
import express, { Router } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// Importar todas as rotas
import authRoutes from './auth.routes';
import userRoutes from './users.routes';
import addressRoutes from './addresses.routes';
import deliveryRoutes from './deliveries.routes';
import transactionRoutes from './transactions.routes';
import smartPointRoutes from './smartpoints.routes';
import notificationRoutes from './notifications.routes';
import supportRoutes from './support.routes';
import reviewRoutes from './reviews.routes';
import analyticsRoutes from './analytics.routes';

const router: Router = express.Router();

// Configurar Swagger
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
  apis: ['./src/routes/*.ts']
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

export default router;

