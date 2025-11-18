// src/routes/analytics.routes.js
const express = require('express');
const router = express.Router();
const { query } = require('express-validator');
const { AnalyticsController } = require('../controllers/analytics.controller');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const analyticsController = new AnalyticsController();

/**
 * @swagger
 * /api/analytics/overview:
 *   get:
 *     summary: Visão geral de métricas do sistema
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Métricas do sistema
 */
router.get('/overview',
  authenticateJWT,
  authorizeRoles(['admin']),
  analyticsController.getOverview
);

/**
 * @swagger
 * /api/analytics/couriers:
 *   get:
 *     summary: Desempenho dos estafetas
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *     responses:
 *       200:
 *         description: Desempenho dos estafetas
 */
router.get('/couriers',
  authenticateJWT,
  authorizeRoles(['admin']),
  query('period').optional().isIn(['day', 'week', 'month', 'year']),
  handleValidationErrors,
  analyticsController.getCouriersPerformance
);

/**
 * @swagger
 * /api/analytics/deliveries:
 *   get:
 *     summary: Estatísticas de entregas
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estatísticas de entregas
 */
router.get('/deliveries',
  authenticateJWT,
  authorizeRoles(['admin']),
  analyticsController.getDeliveryStats
);

/**
 * @swagger
 * /api/analytics/revenue:
 *   get:
 *     summary: Dados financeiros
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dados financeiros
 */
router.get('/revenue',
  authenticateJWT,
  authorizeRoles(['admin']),
  analyticsController.getRevenueData
);

module.exports = router;