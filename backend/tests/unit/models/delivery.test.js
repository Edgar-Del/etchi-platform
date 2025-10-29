const Delivery = require('../../../src/models/Delivery');
const User = require('../../../src/models/User');

describe('Delivery Model', () => {
  let client;

  beforeEach(async () => {
    // Criar usuário cliente para os testes
    client = new User({
      email: 'client@etchi.ao',
      password: 'Senha123!',
      name: 'Cliente Teste',
      phone: '+244923456789',
      role: 'client'
    });
    await client.save();
  });

  test('Deve criar uma entrega com dados válidos', async () => {
    const deliveryData = {
      clientId: client._id,
      pickupAddress: 'Rua da Maianga, Luanda',
      deliveryAddress: 'Rua do Cazenga, Luanda',
      packageDescription: 'Documentos importantes',
      packageSize: 'small',
      urgency: 'standard',
      status: 'pending'
    };

    const delivery = new Delivery(deliveryData);
    const savedDelivery = await delivery.save();

    expect(savedDelivery._id).toBeDefined();
    expect(savedDelivery.clientId.toString()).toBe(client._id.toString());
    expect(savedDelivery.status).toBe('pending');
    expect(savedDelivery.trackingCode).toBeDefined();
  });

  test('Deve calcular preço baseado no tamanho e urgência', async () => {
    const deliveryData = {
      clientId: client._id,
      pickupAddress: 'Rua Teste',
      deliveryAddress: 'Rua Entrega',
      packageDescription: 'Pacote',
      packageSize: 'large',
      urgency: 'express'
    };

    const delivery = new Delivery(deliveryData);
    await delivery.calculatePrice();
    
    expect(delivery.price).toBeGreaterThan(0);
  });
});