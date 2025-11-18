// src/routes/notifications.routes.js
const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { NotificationsController } = require('../controllers/notifications.controller');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

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

module.exports = router;