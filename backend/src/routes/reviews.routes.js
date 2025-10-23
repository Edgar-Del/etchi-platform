// src/routes/reviews.routes.js
const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const ReviewsController = require('../controllers/reviews.controller');
const { authenticateJWT } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const reviewsController = new ReviewsController();

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Criar avaliação de entrega
 *     tags: [Avaliações]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deliveryId
 *               - rating
 *               - comment
 *             properties:
 *               deliveryId:
 *                 type: string
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Avaliação criada
 */
router.post('/',
  authenticateJWT,
  [
    body('deliveryId').isMongoId(),
    body('rating').isInt({ min: 1, max: 5 }),
    body('comment').optional().isLength({ max: 500 })
  ],
  handleValidationErrors,
  reviewsController.createReview
);

/**
 * @swagger
 * /api/reviews/courier/{id}:
 *   get:
 *     summary: Listar avaliações de um estafeta
 *     tags: [Avaliações]
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
 *         description: Lista de avaliações
 */
router.get('/courier/:id',
  authenticateJWT,
  param('id').isMongoId(),
  handleValidationErrors,
  reviewsController.getCourierReviews
);

/**
 * @swagger
 * /api/reviews/average/{id}:
 *   get:
 *     summary: Obter média de classificação do estafeta
 *     tags: [Avaliações]
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
 *         description: Média de classificação
 */
router.get('/average/:id',
  authenticateJWT,
  param('id').isMongoId(),
  handleValidationErrors,
  reviewsController.getAverageRating
);

module.exports = router;