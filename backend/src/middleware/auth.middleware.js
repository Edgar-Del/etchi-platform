// src/middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * @middleware authenticateJWT
 * @description Middleware de autenticação JWT que verifica a validade do token
 * e anexa o usuário autenticado ao objeto req.
 * @module middlewares/auth
 */
const authenticateJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso não fornecido'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar usuário no banco para garantir que ainda existe e está ativo
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Conta desativada'
      });
    }

    // Anexar usuário ao request
    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      isActive: user.isActive
    };

    next();
  } catch (error) {
    console.error('Erro na autenticação JWT:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Erro na autenticação'
    });
  }
};

/**
 * @middleware authorizeRoles
 * @description Middleware de autorização que verifica se o usuário tem as roles necessárias
 * @param {...string} roles - Lista de roles permitidas
 * @returns {Function} Middleware function
 * @module middlewares/auth
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Acesso negado. Requer uma das seguintes roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * @middleware optionalAuth
 * @description Middleware de autenticação opcional que anexa usuário se existir
 * @module middlewares/auth
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await User.findById(decoded.id).select('-password');
      if (user && user.isActive) {
        req.user = {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
          name: user.name
        };
      }
    }
    
    next();
  } catch (error) {
    // Em caso de erro, continuar sem usuário (autenticação opcional)
    next();
  }
};

module.exports = {
  authenticateJWT,
  authorizeRoles,
  optionalAuth
};