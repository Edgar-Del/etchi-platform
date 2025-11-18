const request = require('supertest');
const app = require('../../server');
const User = require('../../src/models/User');

describe('Auth Integration Tests', () => {
  describe('POST /api/auth/register', () => {
    test('Deve registrar novo usuário com sucesso', async () => {
      const userData = {
        email: 'integration@etchi.ao',
        password: 'Senha123!',
        name: 'Integration User',
        phone: '+244923456789',
        role: 'client'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.password).toBeUndefined(); // Senha não deve ser retornada
    });

    test('Deve falhar ao registrar com email duplicado', async () => {
      const userData = {
        email: 'duplicate@etchi.ao',
        password: 'Senha123!',
        name: 'Duplicate User',
        phone: '+244923456789',
        role: 'client'
      };

      // Primeiro registro
      await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Segundo registro com mesmo email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('Deve validar dados de entrada', async () => {
      const invalidData = {
        email: 'email-invalido',
        password: '123', // Muito curta
        name: 'A', // Muito curto
        phone: 'invalid-phone',
        role: 'invalid-role'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Criar usuário para teste de login
      const userData = {
        email: 'login@etchi.ao',
        password: 'Senha123!',
        name: 'Login User',
        phone: '+244923456789',
        role: 'client'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData);
    });

    test('Deve fazer login com credenciais válidas', async () => {
      const loginData = {
        email: 'login@etchi.ao',
        password: 'Senha123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe(loginData.email);
    });

    test('Deve falhar login com senha incorreta', async () => {
      const loginData = {
        email: 'login@etchi.ao',
        password: 'senha-errada'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});