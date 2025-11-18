const UsersService = require('../../../src/services/users.service');
const User = require('../../../src/models/User');

describe('UsersService', () => {
  let usersService;

  beforeEach(() => {
    usersService = new UsersService();
  });

  describe('findById', () => {
    test('Deve encontrar usuário por ID', async () => {
      const user = new User({
        email: 'find@etchi.ao',
        password: 'Senha123!',
        name: 'Usuário Find',
        phone: '+244923456789',
        role: 'client'
      });
      await user.save();

      const foundUser = await usersService.findById(user._id);

      expect(foundUser._id.toString()).toBe(user._id.toString());
      expect(foundUser.email).toBe(user.email);
    });

    test('Deve retornar null para ID inexistente', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011'; // ID MongoDB válido mas inexistente
      
      await expect(usersService.findById(nonExistentId)).rejects.toThrow();
    });
  });

  describe('update', () => {
    test('Deve atualizar usuário com dados válidos', async () => {
      const user = new User({
        email: 'update@etchi.ao',
        password: 'Senha123!',
        name: 'Usuário Original',
        phone: '+244923456789',
        role: 'client'
      });
      await user.save();

      const updateData = {
        name: 'Usuário Atualizado',
        phone: '+244987654321'
      };

      const updatedUser = await usersService.update(user._id, updateData);

      expect(updatedUser.name).toBe(updateData.name);
      expect(updatedUser.phone).toBe(updateData.phone);
      expect(updatedUser.email).toBe(user.email); // Email não deve mudar
    });
  });
});