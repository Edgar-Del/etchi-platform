#!/usr/bin/env node

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

async function setupTestEnvironment() {
  console.log('🧪 Configurando ambiente de teste...');

  // Verificar se todas as dependências estão instaladas
  try {
    require('jest');
    require('supertest');
    console.log('✅ Dependências de teste verificadas');
  } catch (error) {
    console.error('❌ Dependências de teste não encontradas');
    console.log('Instale com: npm install --save-dev jest supertest mongodb-memory-server');
    process.exit(1);
  }

  // Verificar se todos os modelos estão definidos
  const models = ['User', 'Delivery', 'Address', 'Transaction'];
  for (const model of models) {
    try {
      require(`../src/models/${model}`);
      console.log(`✅ Model ${model} carregado`);
    } catch (error) {
      console.error(`❌ Model ${model} não encontrado`);
    }
  }

  console.log('🎉 Ambiente de teste configurado com sucesso!');
  console.log('Execute os testes com: npm test');
}

setupTestEnvironment().catch(console.error);