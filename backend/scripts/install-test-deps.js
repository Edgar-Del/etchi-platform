#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('📦 Instalando dependências de teste...');

const dependencies = [
  'jest',
  'supertest', 
  'mongodb-memory-server'
];

try {
  // Instalar dependências
  execSync(`npm install --save-dev ${dependencies.join(' ')}`, { 
    stdio: 'inherit' 
  });
  
  console.log('✅ Dependências de teste instaladas com sucesso!');
  
  // Verificar se server.js existe
  if (!fs.existsSync('server.js')) {
    console.log('⚠️  Criando server.js básico...');
    fs.writeFileSync('server.js', `
const express = require('express');
const app = express();

app.use(express.json());
app.use('/api', require('./src/routes'));

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'OK' });
});

module.exports = app;
    `.trim());
  }
  
  console.log('🎉 Ambiente configurado! Execute: npm test');
  
} catch (error) {
  console.error('❌ Erro ao instalar dependências:', error.message);
  process.exit(1);
}