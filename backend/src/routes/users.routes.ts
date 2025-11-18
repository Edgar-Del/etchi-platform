// src/routes/users.routes.ts
import express, { Router } from 'express';
import { body, param, query } from 'express-validator';
import { UsersController } from '../controllers/users.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';

const router: Router = express.Router();
const usersController = new UsersController();

/**
 * @swagger
 * components:
 *   schemas:
 *     Location:
 *       type: object
 *       required:
 *         - type
 *         - coordinates
 *       properties:
 *         type:
 *           type: string
 *           enum: [Point]
 *         coordinates:
 *           type: array
 *           items:
 *             type: number
 *           example: [13.2344, -8.8383]
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Listar todos os utilizadores (apenas admin)
 *     tags: [Utilizadores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Limite de resultados por página
 *     responses:
 *       200:
 *         description: Lista de utilizadores
 *       403:
 *         description: Acesso negado
 */
router.get('/', 
  authenticateJWT, 
  authorizeRoles(['admin']),
  usersController.getAllUsers
);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Obter utilizador por ID
 *     tags: [Utilizadores]
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
 *         description: Utilizador encontrado
 *       404:
 *         description: Utilizador não encontrado
 */
router.get('/:id',
  authenticateJWT,
  param('id').isMongoId(),
  handleValidationErrors,
  usersController.getUser
);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Atualizar utilizador
 *     tags: [Utilizadores]
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
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Utilizador atualizado
 *       403:
 *         description: Acesso negado
 */
router.put('/:id',
  authenticateJWT,
  param('id').isMongoId(),
  body('name').optional().notEmpty(),
  body('phone').optional().isMobilePhone(),
  handleValidationErrors,
  usersController.updateUser
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Remover utilizador (apenas admin)
 *     tags: [Utilizadores]
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
 *         description: Utilizador removido
 *       403:
 *         description: Acesso negado
 */
router.delete('/:id',
  authenticateJWT,
  authorizeRoles(['admin']),
  param('id').isMongoId(),
  handleValidationErrors,
  usersController.deactivateUser
);

/**
 * @swagger
 * /api/users/{id}/location:
 *   patch:
 *     summary: Atualizar localização do estafeta
 *     tags: [Utilizadores]
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
 *               - lng
 *               - lat
 *             properties:
 *               lng:
 *                 type: number
 *               lat:
 *                 type: number
 *     responses:
 *       200:
 *         description: Localização atualizada
 *       403:
 *         description: Apenas estafetas podem atualizar localização
 */
router.patch('/:id/location',
  authenticateJWT,
  authorizeRoles(['courier']),
  param('id').isMongoId(),
  body('lng').isFloat({ min: -180, max: 180 }),
  body('lat').isFloat({ min: -90, max: 90 }),
  handleValidationErrors,
  usersController.updateLocation
);

/**
 * @swagger
 * /api/users/nearby/couriers:
 *   get:
 *     summary: Listar estafetas próximos
 *     tags: [Utilizadores]
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
 *         description: Raio em metros (padrão 5000)
 *     responses:
 *       200:
 *         description: Lista de estafetas próximos
 */
router.get('/nearby/couriers',
  authenticateJWT,
  query('lng').isFloat({ min: -180, max: 180 }),
  query('lat').isFloat({ min: -90, max: 90 }),
  query('radius').optional().isInt({ min: 100, max: 50000 }),
  handleValidationErrors,
  usersController.getNearbyCouriers
);

/**
 * @swagger
 * /api/users/{id}/wallet/balance:
 *   get:
 *     summary: Obter saldo da carteira do usuário
 *     tags: [Utilizadores]
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
 *         description: Saldo obtido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     balance:
 *                       type: number
 *       404:
 *         description: Usuário não encontrado
 */
router.get('/:id/wallet/balance',
  authenticateJWT,
  param('id').isMongoId(),
  handleValidationErrors,
  usersController.getWalletBalance
);

/**
 * @swagger
 * /api/users/{id}/fcm-token:
 *   post:
 *     summary: Registrar token FCM para notificações push
 *     tags: [Utilizadores]
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
 *               - token
 *               - deviceId
 *               - platform
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token FCM do dispositivo
 *               deviceId:
 *                 type: string
 *                 description: ID único do dispositivo
 *               platform:
 *                 type: string
 *                 enum: [ios, android]
 *                 description: Plataforma do dispositivo
 *     responses:
 *       200:
 *         description: Token registrado com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/:id/fcm-token',
  authenticateJWT,
  param('id').isMongoId(),
  body('token').notEmpty().isString(),
  body('deviceId').notEmpty().isString(),
  body('platform').isIn(['ios', 'android']),
  handleValidationErrors,
  usersController.registerFCMToken
);

/**
 * @swagger
 * /api/users/{id}/fcm-token:
 *   delete:
 *     summary: Remover token FCM do dispositivo
 *     tags: [Utilizadores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Token removido com sucesso
 *       404:
 *         description: Token não encontrado
 */
router.delete('/:id/fcm-token',
  authenticateJWT,
  param('id').isMongoId(),
  query('deviceId').notEmpty(),
  handleValidationErrors,
  usersController.removeFCMToken
);

export default router;

