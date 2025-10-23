// src/middleware/validation.js
const { body, validationResult } = require('express-validator');

/**
 * Middleware de validação de erros
 */
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Dados de entrada inválidos",
      errors: errors.array()
    });
  }
  next();
};

/**
 * Validações para autenticação
 */
exports.validateRegister = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').notEmpty().trim(),
  body('phone').isMobilePhone(),
  body('role').isIn(['client', 'courier'])
];

exports.validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];