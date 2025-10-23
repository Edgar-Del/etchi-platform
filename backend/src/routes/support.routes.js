// src/routes/support.routes.js
const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const SupportController = require('../controllers/support.controller');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const supportController = new SupportController();

/**
 * @swagger
 * /api/support/ticket:
 *   post:
 *     summary: Criar ticket de suporte
 *     tags: [Suporte]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - message
 *               - category
 *             properties:
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [delivery, payment, technical, account, other]
 *     responses:
 *       201:
 *         description: Ticket criado
 */
router.post('/ticket',
  authenticateJWT,
  [
    body('subject').notEmpty(),
    body('message').notEmpty(),
    body('category').isIn(['delivery', 'payment', 'technical', 'account', 'other'])
  ],
  handleValidationErrors,
  supportController.createTicket
);

/**
 * @swagger
 * /api/support/tickets:
 *   get:
 *     summary: Listar tickets do utilizador
 *     tags: [Suporte]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de tickets
 */
router.get('/tickets',
  authenticateJWT,
  supportController.getUserTickets
);

/**
 * @swagger
 * /api/support/tickets/{id}:
 *   get:
 *     summary: Ver detalhes do ticket
 *     tags: [Suporte]
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
 *         description: Detalhes do ticket
 */
router.get('/tickets/:id',
  authenticateJWT,
  param('id').isMongoId(),
  handleValidationErrors,
  supportController.getTicket
);

/**
 * @swagger
 * /api/support/tickets/{id}/reply:
 *   post:
 *     summary: Adicionar resposta ao ticket
 *     tags: [Suporte]
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
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Resposta adicionada
 */
router.post('/tickets/:id/reply',
  authenticateJWT,
  param('id').isMongoId(),
  body('message').notEmpty(),
  handleValidationErrors,
  supportController.addReply
);

/**
 * @swagger
 * /api/support/tickets/{id}/status:
 *   put:
 *     summary: Atualizar status do ticket (admin/suporte)
 *     tags: [Suporte]
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
 *                 enum: [open, in_progress, resolved, closed]
 *     responses:
 *       200:
 *         description: Status atualizado
 */
router.put('/tickets/:id/status',
  authenticateJWT,
  authorizeRoles(['admin', 'support']),
  param('id').isMongoId(),
  body('status').isIn(['open', 'in_progress', 'resolved', 'closed']),
  handleValidationErrors,
  supportController.updateTicketStatus
);

module.exports = router;