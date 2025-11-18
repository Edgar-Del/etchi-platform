# 🚀 Etchi Platform - Backend API

Plataforma de entregas colaborativas desenvolvida para o mercado angolano.

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Executando o Projeto](#executando-o-projeto)
- [Documentação da API](#documentação-da-api)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Testes](#testes)
- [Deployment](#deployment)

## 🎯 Sobre o Projeto

Etchi Platform é uma solução completa para marketplace de entregas, conectando clientes, entregadores e comerciantes. O backend fornece uma API RESTful robusta com suporte a:

- ✅ Autenticação e autorização JWT
- ✅ Gestão de entregas em tempo real
- ✅ Sistema de pagamentos (Multicaixa Express, PayPal, Wallet)
- ✅ Carteira digital integrada
- ✅ Notificações push (Firebase Cloud Messaging)
- ✅ Tracking em tempo real (Socket.io)
- ✅ Geocodificação e cálculo de rotas (Google Maps)
- ✅ Sistema de avaliações e ratings
- ✅ Suporte ao cliente

## 🛠 Tecnologias

- **Runtime:** Node.js
- **Framework:** Express.js
- **Linguagem:** TypeScript
- **Banco de Dados:** MongoDB
- **Autenticação:** JWT (jsonwebtoken)
- **Validação:** express-validator, Joi
- **Documentação:** Swagger/OpenAPI
- **Real-time:** Socket.io
- **Notificações:** Firebase Admin SDK
- **Geocodificação:** Google Maps API
- **Testes:** Jest

## 📦 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- Node.js (v16 ou superior)
- npm ou yarn
- MongoDB (v5 ou superior)
- Git

## 🚀 Instalação

1. **Clone o repositório:**
```bash
git clone https://github.com/seu-usuario/etchi-platform.git
cd etchi-platform/backend
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure as variáveis de ambiente:**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações.

4. **Inicie o MongoDB:**
```bash
# Usando Docker
docker-compose up -d mongodb

# Ou inicie manualmente
mongod
```

## ⚙️ Configuração

### Variáveis de Ambiente Obrigatórias

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Banco de Dados
MONGODB_URI=mongodb://localhost:27017/etchi_db

# JWT
JWT_SECRET=seu-secret-jwt-aqui
JWT_REFRESH_SECRET=seu-refresh-secret-aqui

# Google Maps
GOOGLE_MAPS_API_KEY=sua-chave-google-maps

# Firebase (para notificações push)
# Opção 1: Usar arquivo de service account (recomendado)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/firebase-service-account.json

# Opção 2: Usar variáveis de ambiente
FIREBASE_PROJECT_ID=seu-project-id
FIREBASE_CLIENT_EMAIL=seu-client-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Configuração do Firebase

O Firebase Admin SDK pode ser configurado de duas formas:

#### Opção 1: Arquivo de Service Account (Recomendado)

1. Baixe o arquivo JSON de service account do Firebase Console
2. Salve o arquivo em um local seguro (ex: `backend/config/firebase-service-account.json`)
3. Configure a variável de ambiente:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/firebase-service-account.json
   ```
   Ou adicione no `.env`:
   ```env
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/firebase-service-account.json
   ```

#### Opção 2: Variáveis de Ambiente

Configure as seguintes variáveis no `.env`:
```env
FIREBASE_PROJECT_ID=seu-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@seu-projeto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Nota:** O `FIREBASE_PRIVATE_KEY` deve incluir as quebras de linha (`\n`) e estar entre aspas.

**Importante:** 
- ⚠️ Nunca commite arquivos de credenciais do Firebase no repositório
- ✅ Adicione `*.json` de service accounts ao `.gitignore`
- ✅ Use variáveis de ambiente em produção

### Variáveis Opcionais

Consulte o arquivo `.env.example` para ver todas as variáveis disponíveis.

## 🏃 Executando o Projeto

### Modo Desenvolvimento

```bash
npm run dev
```

O servidor estará disponível em `http://localhost:3000`

### Modo Produção

```bash
# Compilar TypeScript
npm run build

# Iniciar servidor
npm start
```

### Com Docker

```bash
docker-compose up -d
```

## 📚 Documentação da API

A documentação completa da API está disponível via Swagger:

**URL:** `http://localhost:3000/api/docs`

### Endpoints Principais

#### Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Renovar token
- `POST /api/auth/reset-password` - Recuperar senha

#### Usuários
- `GET /api/users` - Listar usuários (admin)
- `GET /api/users/:id` - Obter usuário
- `PUT /api/users/:id` - Atualizar usuário
- `GET /api/users/:id/wallet/balance` - Obter saldo da carteira
- `POST /api/users/:id/fcm-token` - Registrar token FCM

#### Entregas
- `POST /api/deliveries` - Criar entrega
- `GET /api/deliveries` - Listar entregas
- `GET /api/deliveries/:id` - Obter entrega
- `GET /api/deliveries/:id/track` - Rastrear entrega
- `PUT /api/deliveries/:id/status` - Atualizar status
- `PATCH /api/deliveries/:id/assign` - Atribuir entregador

#### Transações
- `POST /api/transactions/initiate` - Iniciar pagamento
- `GET /api/transactions/:id` - Obter transação
- `POST /api/transactions/wallet/topup` - Recarregar carteira
- `POST /api/transactions/wallet/withdraw` - Sacar da carteira

#### Notificações
- `GET /api/notifications` - Listar notificações
- `PUT /api/notifications/:id/read` - Marcar como lida

## 📁 Estrutura do Projeto

```
backend/
├── src/
│   ├── config/          # Configurações (database, etc)
│   ├── controllers/     # Controladores (lógica de requisições)
│   ├── middleware/      # Middlewares (auth, validation, etc)
│   ├── models/         # Modelos Mongoose
│   ├── routes/         # Definição de rotas
│   ├── services/       # Lógica de negócio
│   ├── types/          # Tipos TypeScript
│   ├── utils/          # Utilitários
│   └── app.ts          # Aplicação principal
├── tests/              # Testes
├── uploads/            # Arquivos enviados
├── .env.example        # Exemplo de variáveis de ambiente
├── package.json
├── tsconfig.json
└── README.md
```

## 🧪 Testes

### Executar todos os testes:
```bash
npm test
```

### Testes com cobertura:
```bash
npm run test:coverage
```

### Testes unitários:
```bash
npm run test:unit
```

### Testes de integração:
```bash
npm run test:integration
```

## 🚢 Deployment

### Preparação

1. Configure todas as variáveis de ambiente em produção
2. Compile o TypeScript:
```bash
npm run build
```

3. Execute migrações se necessário

### Opções de Deployment

#### Heroku
```bash
heroku create etchi-api
heroku config:set MONGODB_URI=...
heroku config:set JWT_SECRET=...
git push heroku main
```

#### Docker
```bash
docker build -t etchi-api .
docker run -p 3000:3000 --env-file .env etchi-api
```

#### VPS/Cloud
- Use PM2 para gerenciar o processo
- Configure Nginx como reverse proxy
- Configure SSL/TLS
- Configure backups do MongoDB

## 🔒 Segurança

- ✅ Autenticação JWT
- ✅ Hash de senhas com bcrypt
- ✅ Validação de inputs
- ✅ Rate limiting
- ✅ CORS configurado
- ✅ Helmet.js para headers de segurança
- ✅ Sanitização de dados

## 📝 Licença

Este projeto é propriedade da Etchi Platform.

## 👥 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

Para suporte, envie um email para suporte@etchi.ao ou abra uma issue no GitHub.

## 🗺 Roadmap

- [ ] Implementar testes E2E
- [ ] Adicionar cache com Redis
- [ ] Implementar filas com Bull
- [ ] Adicionar monitoramento (Sentry)
- [ ] Implementar CI/CD
- [ ] Adicionar documentação de deployment

---

**Desenvolvido com ❤️ pela equipe Etchi Platform**

