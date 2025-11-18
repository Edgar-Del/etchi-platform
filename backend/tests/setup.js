const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

// Configurar variáveis de ambiente para teste
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-very-long-key-for-testing';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-very-long-key-for-testing';
process.env.BCRYPT_ROUNDS = '1'; // Para testes ser mais rápido

beforeAll(async () => {
  try {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB Memory Server conectado');
  } catch (error) {
    console.error('❌ Erro ao conectar MongoDB Memory Server:', error);
    throw error;
  }
}, 30000); // Aumentar timeout para 30 segundos

afterAll(async () => {
  try {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
    console.log('✅ MongoDB Memory Server desconectado');
  } catch (error) {
    console.error('❌ Erro ao desconectar MongoDB Memory Server:', error);
  }
});

afterEach(async () => {
  try {
    // Limpar todas as collections após cada teste
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      try {
        await collections[key].deleteMany();
      } catch (error) {
        console.warn(`⚠️  Erro ao limpar collection ${key}:`, error.message);
      }
    }
  } catch (error) {
    console.error('❌ Erro no afterEach:', error);
  }
});