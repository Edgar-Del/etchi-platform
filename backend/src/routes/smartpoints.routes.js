// src/routes/smartpoints.routes.js
const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { SmartPointsController } = require('../controllers/smart-points.controller');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const smartPointsController = new SmartPointsController();

/**
 * @swagger
 * /api/smartpoints:
 *   post:
 *     summary: Criar ponto inteligente (admin)
 *     tags: [Pontos Inteligentes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - lng
 *               - lat
 *               - address
 *             properties:
 *               name:
 *                 type: string
 *               lng:
 *                 type: number
 *               lat:
 *                 type: number
 *               address:
 *                 type: string
 *               operatingHours:
 *                 type: string
 *               capacity:
 *                 type: number
 *     responses:
 *       201:
 *         description: Ponto criado
 */
router.post('/',
  authenticateJWT,
  authorizeRoles(['admin']),
  [
    body('name').notEmpty(),
    body('lng').isFloat({ min: -180, max: 180 }),
    body('lat').isFloat({ min: -90, max: 90 }),
    body('address').notEmpty()
  ],
  handleValidationErrors,
  smartPointsController.createSmartPoint
);

/**
 * @swagger
 * /api/smartpoints:
 *   get:
 *     summary: Listar todos os pontos
 *     tags: [Pontos Inteligentes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de pontos
 */
router.get('/',
  authenticateJWT,
  smartPointsController.getAllSmartPoints
);

/**
 * @swagger
 * /api/smartpoints/nearby:
 *   get:
 *     summary: Buscar pontos próximos
 *     tags: [Pontos Inteligentes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Pontos próximos
 */
router.get('/nearby',
  authenticateJWT,
  [
    query('lng').isFloat({ min: -180, max: 180 }),
    query('lat').isFloat({ min: -90, max: 90 }),
    query('radius').optional().isInt({ min: 100, max: 50000 })
  ],
  handleValidationErrors,
  smartPointsController.getNearbySmartPoints
);

/**
 * @swagger
 * /api/smartpoints/{id}/status:
 *   put:
 *     summary: Atualizar disponibilidade do ponto
 *     tags: [Pontos Inteligentes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive, maintenance]
 *     responses:
 *       200:
 *         description: Status atualizado
 */
router.put('/:id/status',
  authenticateJWT,
  authorizeRoles(['admin']),
  param('id').isMongoId(),
  body('status').isIn(['active', 'inactive', 'maintenance']),
  handleValidationErrors,
  smartPointsController.updateSmartPointStatus
);

module.exports = router;