// src/routes/deliveries.routes.ts
import express, { Router } from 'express';
import { body, param, query } from 'express-validator';
import { DeliveriesController } from '../controllers/deliveries.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';

const router: Router = express.Router();
const deliveriesController = new DeliveriesController();

/**
 * @swagger
 * /api/deliveries:
 *   post:
 *     summary: Criar nova entrega
 *     tags: [Entregas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pickupAddress
 *               - deliveryAddress
 *               - packageDescription
 *             properties:
 *               pickupAddress:
 *                 type: string
 *               deliveryAddress:
 *                 type: string
 *               packageDescription:
 *                 type: string
 *               packageSize:
 *                 type: string
 *                 enum: [small, medium, large]
 *               urgency:
 *                 type: string
 *                 enum: [standard, express, urgent]
 *               instructions:
 *                 type: string
 *     responses:
 *       201:
 *         description: Entrega criada com sucesso
 */
router.post('/',
  authenticateJWT,
  authorizeRoles(['client']),
  [
    body('pickupAddress').notEmpty(),
    body('deliveryAddress').notEmpty(),
    body('packageDescription').notEmpty(),
    body('packageSize').optional().isIn(['small', 'medium', 'large']),
    body('urgency').optional().isIn(['standard', 'express', 'urgent'])
  ],
  handleValidationErrors,
  deliveriesController.createDelivery
);

/**
 * @swagger
 * /api/deliveries:
 *   get:
 *     summary: Listar entregas
 *     tags: [Entregas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filtrar por status
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *       - in: query
 *         name: courierId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de entregas
 */
router.get('/',
  authenticateJWT,
  deliveriesController.getDeliveries
);

/**
 * @swagger
 * /api/deliveries/mine:
 *   get:
 *     summary: Listar minhas entregas
 *     tags: [Entregas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Minhas entregas listadas
 */
router.get('/mine',
  authenticateJWT,
  deliveriesController.getMyDeliveries
);

/**
 * @swagger
 * /api/deliveries/{id}:
 *   get:
 *     summary: Obter detalhes da entrega
 *     tags: [Entregas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalhes da entrega
 */
router.get('/:id',
  authenticateJWT,
  param('id').isMongoId(),
  handleValidationErrors,
  deliveriesController.getDelivery
);

/**
 * @swagger
 * /api/deliveries/{id}/status:
 *   put:
 *     summary: Atualizar status da entrega
 *     tags: [Entregas]
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
 *                 enum: [pending, assigned, picked_up, in_transit, delivered, cancelled]
 *     responses:
 *       200:
 *         description: Status atualizado
 */
router.put('/:id/status',
  authenticateJWT,
  authorizeRoles(['courier', 'admin']),
  param('id').isMongoId(),
  body('status').isIn(['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled']),
  handleValidationErrors,
  deliveriesController.updateDeliveryStatus
);

/**
 * @swagger
 * /api/deliveries/{id}/assign:
 *   patch:
 *     summary: Atribuir estafeta à entrega
 *     tags: [Entregas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estafeta atribuído
 */
router.patch('/:id/assign',
  authenticateJWT,
  authorizeRoles(['admin', 'system']),
  param('id').isMongoId(),
  handleValidationErrors,
  deliveriesController.assignCourier
);

/**
 * @swagger
 * /api/deliveries/{id}/track:
 *   get:
 *     summary: Acompanhar entrega em tempo real
 *     tags: [Entregas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dados de tracking
 */
router.get('/:id/track',
  authenticateJWT,
  param('id').isMongoId(),
  handleValidationErrors,
  deliveriesController.trackDelivery
);

export default router;

