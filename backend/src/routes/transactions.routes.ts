// src/routes/transactions.routes.ts
import express, { Router } from 'express';
import { body, param, query } from 'express-validator';
import { TransactionsController } from '../controllers/transactions.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';

const router: Router = express.Router();
const transactionsController = new TransactionsController();

/**
 * @swagger
 * /api/transactions/initiate:
 *   post:
 *     summary: Iniciar pagamento
 *     tags: [Transações]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - currency
 *               - paymentMethod
 *             properties:
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *                 default: AOA
 *               paymentMethod:
 *                 type: string
 *                 enum: [multicaixa, paypal, wallet]
 *               deliveryId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pagamento iniciado
 */
router.post('/initiate',
  authenticateJWT,
  [
    body('amount').isFloat({ min: 0 }),
    body('currency').isIn(['AOA', 'USD']),
    body('paymentMethod').isIn(['multicaixa', 'paypal', 'wallet']),
    body('deliveryId').optional().isMongoId()
  ],
  handleValidationErrors,
  transactionsController.initiatePayment
);

/**
 * @swagger
 * /api/transactions/verify/{id}:
 *   get:
 *     summary: Verificar status da transação
 *     tags: [Transações]
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
 *         description: Status da transação
 */
router.get('/verify/:id',
  authenticateJWT,
  param('id').isMongoId(),
  handleValidationErrors,
  transactionsController.verifyTransaction
);

/**
 * @swagger
 * /api/transactions/wallet:
 *   get:
 *     summary: Consultar saldo da carteira
 *     tags: [Transações]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Saldo da carteira
 */
router.get('/wallet',
  authenticateJWT,
  transactionsController.getWalletBalance
);

/**
 * @swagger
 * /api/transactions/wallet/deposit:
 *   post:
 *     summary: Depositar na carteira
 *     tags: [Transações]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Depósito realizado
 */
router.post('/wallet/deposit',
  authenticateJWT,
  body('amount').isFloat({ min: 0 }),
  handleValidationErrors,
  transactionsController.depositToWallet
);

/**
 * @swagger
 * /api/transactions/wallet/withdraw:
 *   post:
 *     summary: Solicitar levantamento
 *     tags: [Transações]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Levantamento solicitado
 */
router.post('/wallet/withdraw',
  authenticateJWT,
  body('amount').isFloat({ min: 0 }),
  handleValidationErrors,
  transactionsController.withdrawFromWallet
);

/**
 * @swagger
 * /api/transactions/history:
 *   get:
 *     summary: Histórico de transações
 *     tags: [Transações]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Histórico de transações
 */
router.get('/history',
  authenticateJWT,
  transactionsController.getTransactionHistory
);

export default router;

