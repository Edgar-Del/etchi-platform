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
  body('role').isIn(['client', 'courier']).withMessage('Role deve ser client ou courier'),
];

export const validateLogin: ValidationChain[] = [
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Senha é obrigatória'),
];
