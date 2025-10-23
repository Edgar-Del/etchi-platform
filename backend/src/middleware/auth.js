// src/middleware/auth.js
const jwt = require('jsonwebtoken');

/**
 * Middleware de autenticação JWT
 */
exports.authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: "Token de acesso não fornecido"
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Token inválido ou expirado"
    });
  }
};

/**
 * Middleware de autorização por roles
 */
exports.authorizeRoles = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Usuário não autenticado"
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Acesso negado. Permissões insuficientes."
      });
    }
    
    next();
  };
};