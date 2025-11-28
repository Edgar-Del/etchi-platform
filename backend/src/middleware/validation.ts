// src/middleware/validation.ts
import { Request, Response, NextFunction } from 'express';
import { validationResult, body, ValidationChain } from 'express-validator';

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      errors: errors.array(),
    });
    return;
  }
  next();
};

export const validateRegister: ValidationChain[] = [
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
  body('name').notEmpty().trim().withMessage('Nome é obrigatório'),
  body('phone').notEmpty().withMessage('Telefone é obrigatório'),
  // Aceitar role (client/courier) ou userType (customer/delivery_partner/etc)
  body('role')
    .optional()
    .isIn(['client', 'courier'])
    .withMessage('Role deve ser client ou courier'),
  body('userType')
    .optional()
    .isIn(['customer', 'delivery_partner', 'smart_point_manager', 'admin'])
    .withMessage('userType inválido'),
  // Validar que pelo menos um dos dois seja fornecido
  body().custom((value) => {
    if (!value.role && !value.userType) {
      throw new Error('role ou userType é obrigatório');
    }
    return true;
  }),
];

export const validateLogin: ValidationChain[] = [
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Senha é obrigatória'),
];
