#!/usr/bin/env node

const mongoose = require('mongoose');

async function healthCheck() {
  console.log('🏥 Verificando saúde da aplicação...');

  // 1. Verificar conexão com banco de dados
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/etchi-test');
    console.log('✅ Conexão com MongoDB: OK');
    
    // Verificar se collections existem
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`✅ Collections encontradas: ${collections.length}`);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Erro na conexão MongoDB:', error.message);
  }

  // 2. Verificar se arquivos essenciais existem
  const essentialFiles = [
    'server.js',
    'src/models/User.js',
    'src/controllers/auth.controller.js',
    'src/middlewares/auth.middleware.js'
  ];

  const fs = require('fs');
  for (const file of essentialFiles) {
    if (fs.existsSync(file)) {
      console.log(`✅ Arquivo ${file}: OK`);
    } else {
      console.error(`❌ Arquivo ${file}: Não encontrado`);
    }
  }

  console.log('📊 Health check completo!');
}

healthCheck().catch(console.error);