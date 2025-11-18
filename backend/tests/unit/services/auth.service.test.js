const AuthService = require('../../../src/services/auth.service');
const User = require('../../../src/models/User');
const jwt = require('jsonwebtoken');

describe('AuthService', () => {
  let authService;

  beforeEach(() => {
    authService = new AuthService();
  });

  describe('register', () => {
    test('Deve registrar novo usuário com sucesso', async () => {
      const userData = {
        email: 'newuser@etchi.ao',
        password: 'Senha123!',
        name: 'Novo Usuário',
        phone: '+244923456789',
        role: 'client'
      };

      const result = await authService.register(userData);

      expect(result.success).toBe(true);
      expect(result.data.user.email).toBe(userData.email);
      expect(result.data.token).toBeDefined();
      
      // Verificar se usuário foi salvo no banco
      const savedUser = await User.findOne({ email: userData.email });
      expect(savedUser).toBeDefined();
      expect(savedUser.name).toBe(userData.name);
    });

    test('Não deve registrar usuário com email duplicado', async () => {
      const userData = {
        email: 'duplicate@etchi.ao',
        password: 'Senha123!',
        name: 'Usuário Teste',
        phone: '+244923456789',
        role: 'client'
      };

      await authService.register(userData);
      
      await expect(authService.register(userData)).rejects.toThrow();
    });
  });

  describe('login', () => {
    test('Deve fazer login com credenciais válidas', async () => {
      const userData = {
        email: 'login@etchi.ao',
        password: 'Senha123!',
        name: 'Usuário Login',
        phone: '+244923456789',
        role: 'client'
      };

      await authService.register(userData);

      const loginData = {
        email: userData.email,
        password: userData.password
      };

      const result = await authService.login(loginData);

      expect(result.success).toBe(true);
      expect(result.data.token).toBeDefined();
      expect(result.data.user.email).toBe(userData.email);
    });

    test('Não deve fazer login com senha inválida', async () => {
      const userData = {
        email: 'login@etchi.ao',
        password: 'Senha123!',
        name: 'Usuário Login',
        phone: '+244923456789',
        role: 'client'
      };

      await authService.register(userData);

      const loginData = {
        email: userData.email,
        password: 'senha-errada'
      };

      await expect(authService.login(loginData)).rejects.toThrow();
    });
  });
});