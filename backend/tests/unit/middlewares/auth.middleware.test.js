const jwt = require('jsonwebtoken');
const { authenticateJWT, authorizeRoles } = require('../../../src/middlewares/auth.middleware');
const User = require('../../../src/models/User');

// Mock do Express
const mockRequest = (headers = {}) => ({
  headers,
  user: null
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

describe('Auth Middleware', () => {
  let user;

  beforeEach(async () => {
    user = new User({
      email: 'middleware@etchi.ao',
      password: 'Senha123!',
      name: 'Middleware User',
      phone: '+244923456789',
      role: 'client'
    });
    await user.save();
  });

  describe('authenticateJWT', () => {
    test('Deve autenticar com token válido', async () => {
      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET
      );

      const req = mockRequest({
        authorization: `Bearer ${token}`
      });
      const res = mockResponse();

      await authenticateJWT(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(user._id.toString());
    });

    test('Deve rejeitar token inválido', async () => {
      const req = mockRequest({
        authorization: 'Bearer token-invalido'
      });
      const res = mockResponse();

      await authenticateJWT(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token inválido'
      });
    });

    test('Deve rejeitar requisição sem token', async () => {
      const req = mockRequest();
      const res = mockResponse();

      await authenticateJWT(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token de acesso não fornecido'
      });
    });
  });

  describe('authorizeRoles', () => {
    test('Deve permitir acesso para role autorizada', () => {
      const req = mockRequest();
      req.user = { role: 'admin' };
      const res = mockResponse();
      const middleware = authorizeRoles('admin', 'client');

      middleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    test('Deve negar acesso para role não autorizada', () => {
      const req = mockRequest();
      req.user = { role: 'client' };
      const res = mockResponse();
      const middleware = authorizeRoles('admin');

      middleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Acesso negado. Requer uma das seguintes roles: admin'
      });
    });
  });
});