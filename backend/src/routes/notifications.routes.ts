// src/routes/notifications.routes.ts
import express, { Router } from 'express';
import { body, param } from 'express-validator';
import { NotificationsController } from '../controllers/notifications.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';

const router: Router = express.Router();
const notificationsController = new NotificationsController();

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Listar notificações do utilizador
 *     tags: [Notificações]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: read
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Lista de notificações
 */
router.get('/',
  authenticateJWT,
  notificationsController.getUserNotifications
);

/**
 * @swagger
 * /api/notifications/send:
 *   post:
 *     summary: Enviar notificação manual (admin)
 *     tags: [Notificações]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - message
 *               - userId
 *             properties:
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Notificação enviada
 */
router.post('/send',
  authenticateJWT,
  authorizeRoles(['admin']),
  [
    body('title').notEmpty(),
    body('message').notEmpty(),
    body('userId').isMongoId()
  ],
  handleValidationErrors,
  notificationsController.sendNotification
);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Marcar notificação como lida
 *     tags: [Notificações]
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
 *         description: Notificação marcada como lida
 */
router.patch('/:id/read',
  authenticateJWT,
  param('id').isMongoId(),
  handleValidationErrors,
  notificationsController.markAsRead
);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Remover notificação
 *     tags: [Notificações]
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
 *         description: Notificação removida
 */
router.delete('/:id',
  authenticateJWT,
  param('id').isMongoId(),
  handleValidationErrors,
  notificationsController.deleteNotification
);

export default router;

