// src/routes/addresses.routes.ts
import express, { Router } from 'express';
import { body, param } from 'express-validator';
import { AddressesController } from '../controllers/addresses.controller';
import { authenticateJWT } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';

const router: Router = express.Router();
const addressesController = new AddressesController();

/**
 * @swagger
 * /api/addresses:
 *   post:
 *     summary: Criar novo endereço
 *     tags: [Endereços]
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
 *               - street
 *               - city
 *               - lng
 *               - lat
 *             properties:
 *               name:
 *                 type: string
 *                 description: "Nome do endereço (ex: Casa, Trabalho)"
 *               street:
 *                 type: string
 *               city:
 *                 type: string
 *               province:
 *                 type: string
 *               lng:
 *                 type: number
 *               lat:
 *                 type: number
 *               instructions:
 *                 type: string
 *     responses:
 *       201:
 *         description: Endereço criado com sucesso
 */
router.post('/',
  authenticateJWT,
  [
    body('name').notEmpty(),
    body('street').notEmpty(),
    body('city').notEmpty(),
    body('lng').isFloat({ min: -180, max: 180 }),
    body('lat').isFloat({ min: -90, max: 90 })
  ],
  handleValidationErrors,
  addressesController.createAddress
);

/**
 * @swagger
 * /api/addresses:
 *   get:
 *     summary: Listar endereços do utilizador
 *     tags: [Endereços]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de endereços
 */
router.get('/',
  authenticateJWT,
  addressesController.getUserAddresses
);

/**
 * @swagger
 * /api/addresses/{id}:
 *   put:
 *     summary: Atualizar endereço
 *     tags: [Endereços]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               street:
 *                 type: string
 *               city:
 *                 type: string
 *               instructions:
 *                 type: string
 *     responses:
 *       200:
 *         description: Endereço atualizado
 */
router.put('/:id',
  authenticateJWT,
  param('id').isMongoId(),
  handleValidationErrors,
  addressesController.updateAddress
);

/**
 * @swagger
 * /api/addresses/{id}:
 *   delete:
 *     summary: Remover endereço
 *     tags: [Endereços]
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
 *         description: Endereço removido
 */
router.delete('/:id',
  authenticateJWT,
  param('id').isMongoId(),
  handleValidationErrors,
  addressesController.deleteAddress
);

export default router;

