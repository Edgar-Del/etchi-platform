// src/middlewares/validation.middleware.js
const { validationResult, body, param, query } = require('express-validator');

/**
 * @middleware handleValidationErrors
 * @description Middleware que processa os resultados da validação do express-validator
 * @module middlewares/validation
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value,
      location: error.location
    }));

    return res.status(400).json({
      success: false,
      message: 'Dados de entrada inválidos',
      errors: formattedErrors
    });
  }

  next();
};

/**
 * @validator userValidation
 * @description Regras de validação para criação/atualização de usuários
 */
const userValidation = {
  register: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Email inválido'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('A senha deve ter pelo menos 6 caracteres')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('A senha deve conter letras maiúsculas, minúsculas e números'),
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Nome deve ter entre 2 e 50 caracteres'),
    body('phone')
      .isMobilePhone('pt-BR')
      .withMessage('Número de telefone inválido'),
    body('role')
      .isIn(['client', 'courier'])
      .withMessage('Role deve ser client ou courier')
  ],

  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Email inválido'),
    body('password')
      .notEmpty()
      .withMessage('Senha é obrigatória')
  ],

  update: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Nome deve ter entre 2 e 50 caracteres'),
    body('phone')
      .optional()
      .isMobilePhone('pt-BR')
      .withMessage('Número de telefone inválido')
  ]
};

/**
 * @validator deliveryValidation
 * @description Regras de validação para entregas
 */
const deliveryValidation = {
  create: [
    body('pickupAddress')
      .notEmpty()
      .withMessage('Endereço de coleta é obrigatório'),
    body('deliveryAddress')
      .notEmpty()
      .withMessage('Endereço de entrega é obrigatório'),
    body('packageDescription')
      .notEmpty()
      .withMessage('Descrição da encomenda é obrigatória'),
    body('packageSize')
      .optional()
      .isIn(['small', 'medium', 'large'])
      .withMessage('Tamanho deve ser small, medium ou large'),
    body('urgency')
      .optional()
      .isIn(['standard', 'express', 'urgent'])
      .withMessage('Urgência deve ser standard, express ou urgent')
  ],

  updateStatus: [
    body('status')
      .isIn(['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled'])
      .withMessage('Status inválido')
  ]
};

/**
 * @validator addressValidation
 * @description Regras de validação para endereços
 */
const addressValidation = {
  create: [
    body('name')
      .notEmpty()
      .withMessage('Nome do endereço é obrigatório'),
    body('street')
      .notEmpty()
      .withMessage('Rua é obrigatória'),
    body('city')
      .notEmpty()
      .withMessage('Cidade é obrigatória'),
    body('lng')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude inválida'),
    body('lat')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude inválida')
  ]
};

/**
 * @validator idValidation
 * @description Validação de IDs MongoDB
 */
const idValidation = {
  mongoId: [
    param('id')
      .isMongoId()
      .withMessage('ID inválido')
  ],

  userId: [
    param('userId')
      .isMongoId()
      .withMessage('ID de usuário inválido')
  ],

  deliveryId: [
    param('deliveryId')
      .isMongoId()
      .withMessage('ID de entrega inválido')
  ]
};

/**
 * @validator paginationValidation
 * @description Validação para parâmetros de paginação
 */
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página deve ser um número maior que 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite deve ser entre 1 e 100')
];

module.exports = {
  handleValidationErrors,
  userValidation,
  deliveryValidation,
  addressValidation,
  idValidation,
  paginationValidation,
  validation: {
    body,
    param,
    query
  }
};