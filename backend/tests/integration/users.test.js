const request = require('supertest');
const app = require('../../server');
const User = require('../../src/models/User');
const jwt = require('jsonwebtoken');

describe('Users Integration Tests', () => {
  let authToken;
  let testUser;

  beforeEach(async () => {
    // Criar usuário e token para testes autenticados
    testUser = new User({
      email: 'usertest@etchi.ao',
      password: 'Senha123!',
      name: 'User Test',
      phone: '+244923456789',
      role: 'client'
    });
    await testUser.save();

    authToken = jwt.sign(
      { id: testUser._id, email: testUser.email, role: testUser.role },
      process.env.JWT_SECRET
    );
  });

  describe('GET /api/users/:id', () => {
    test('Deve retornar usuário por ID para usuário autenticado', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testUser._id.toString());
      expect(response.body.data.email).toBe(testUser.email);
    });

    test('Deve negar acesso sem autenticação', async () => {
      await request(app)
        .get(`/api/users/${testUser._id}`)
        .expect(401);
    });

    test('Deve retornar 404 para usuário inexistente', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      
      await request(app)
        .get(`/api/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/users/:id', () => {
    test('Deve atualizar usuário com dados válidos', async () => {
      const updateData = {
        name: 'Nome Atualizado',
        phone: '+244987654321'
      };

      const response = await request(app)
        .put(`/api/users/${testUser._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.phone).toBe(updateData.phone);
    });

    test('Não deve permitir atualizar email', async () => {
      const updateData = {
        email: 'novoemail@etchi.ao' // Não deve ser permitido
      };

      const response = await request(app)
        .put(`/api/users/${testUser._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      // Email não deve mudar
      expect(response.body.data.email).toBe(testUser.email);
    });
  });
});