const User = require('../../../src/models/User');

describe('User Model', () => {
  test('Deve criar um usuário com dados válidos', async () => {
    const userData = {
      email: 'test@etchi.ao',
      password: 'Senha123!',
      name: 'João Silva',
      phone: '+244923456789',
      role: 'client'
    };

    const user = new User(userData);
    const savedUser = await user.save();

    expect(savedUser._id).toBeDefined();
    expect(savedUser.email).toBe(userData.email);
    expect(savedUser.name).toBe(userData.name);
    expect(savedUser.role).toBe(userData.role);
    expect(savedUser.isActive).toBe(true);
    expect(savedUser.createdAt).toBeDefined();
    expect(savedUser.password).not.toBe(userData.password); // Deve estar hasheado
  });

  test('Não deve criar usuário com email duplicado', async () => {
    const userData = {
      email: 'duplicate@etchi.ao',
      password: 'Senha123!',
      name: 'User One',
      phone: '+244923456780',
      role: 'client'
    };

    await new User(userData).save();
    
    await expect(new User(userData).save()).rejects.toThrow();
  });

  test('Deve validar formato de email', async () => {
    const userData = {
      email: 'email-invalido',
      password: 'Senha123!',
      name: 'Test User',
      phone: '+244923456789',
      role: 'client'
    };

    await expect(new User(userData).save()).rejects.toThrow();
  });

  test('Deve validar role válida', async () => {
    const userData = {
      email: 'test@etchi.ao',
      password: 'Senha123!',
      name: 'Test User',
      phone: '+244923456789',
      role: 'invalid-role'
    };

    await expect(new User(userData).save()).rejects.toThrow();
  });
});