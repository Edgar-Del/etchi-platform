# Relatório de Testes do Backend Etchi

## Status Geral
- ✅ Servidor rodando e respondendo
- ✅ Health check funcionando
- ✅ Registro de usuários funcionando
- ⚠️ Login com problemas (investigando)
- ⚠️ Tokens não sendo extraídos corretamente do registro

## Testes Realizados

### 1. Health Check ✅
- Endpoint: `GET /api/health`
- Status: **PASSANDO**
- Resposta: API funcionando corretamente

### 2. Autenticação

#### Registro de Cliente ✅
- Endpoint: `POST /api/auth/register`
- Status: **PASSANDO**
- Usuários podem ser registrados com sucesso
- Token é gerado e retornado na resposta

#### Registro de Courier ✅
- Endpoint: `POST /api/auth/register`
- Status: **PASSANDO**
- Entregadores podem ser registrados

#### Login ⚠️
- Endpoint: `POST /api/auth/login`
- Status: **FALHANDO**
- Erro: "Credenciais inválidas"
- Possível causa: Problema na validação de senha ou busca de usuário

#### Forgot Password ✅
- Endpoint: `POST /api/auth/forgot-password`
- Status: **PASSANDO**
- Email de recuperação é processado

### 3. Módulos Testáveis (requerem autenticação)

Os seguintes módulos requerem tokens JWT válidos:
- Usuários
- Endereços
- Entregas
- Transações
- Smart Points
- Notificações
- Reviews
- Support
- Analytics

## Problemas Identificados

1. **Login não funciona**: Mesmo com credenciais corretas, o login retorna erro 401
2. **Extração de tokens**: Tokens do registro não estão sendo extraídos corretamente no script
3. **Clerk Middleware**: Foi desabilitado temporariamente (requer configuração)

## Próximos Passos

1. Investigar e corrigir o problema de login
2. Ajustar extração de tokens no script de teste
3. Testar todos os módulos após correção do login
4. Configurar Clerk ou remover completamente se não for necessário

## Comandos para Teste Manual

```bash
# Health Check
curl http://localhost:3000/api/health

# Registrar Cliente
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@etchi.com",
    "password": "1234567890",
    "name": "Test User",
    "phone": "+244923456789",
    "role": "client"
  }'

# Login (atualmente falhando)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@etchi.com",
    "password": "1234567890"
  }'
```

