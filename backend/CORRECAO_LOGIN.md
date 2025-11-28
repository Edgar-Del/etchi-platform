# Correção do Problema de Login

## Problema Identificado

O login estava falhando com erro "Credenciais inválidas" mesmo com credenciais corretas.

## Causa Raiz

A senha estava sendo hasheada **duas vezes**:
1. Manualmente no método `registerUser` com `bcrypt.hash(password, 12)`
2. Automaticamente pelo middleware `pre('save')` do modelo User

Isso fazia com que:
- No registro: senha era hasheada manualmente → depois hasheada novamente pelo middleware → senha duplamente hasheada no banco
- No login: senha do usuário (texto plano) era comparada com senha duplamente hasheada → sempre falhava

## Solução Aplicada

Removido o hash manual no método `registerUser` e deixado apenas o middleware `pre('save')` fazer o hash da senha.

### Código Antes:
```typescript
// Hash da password
const hashedPassword = await bcrypt.hash(password, 12);

// Criar usuário
const user = await User.create({
  // ...
  password: hashedPassword,
  // ...
});
```

### Código Depois:
```typescript
// Criar usuário (o hash da password será feito pelo middleware pre('save') do modelo)
const user = await User.create({
  // ...
  password: password, // Senha em texto plano - será hasheada pelo middleware
  // ...
});
```

## Testes Realizados

✅ **Registro de usuário**: Funcionando corretamente
✅ **Login**: Funcionando corretamente
✅ **Geração de token JWT**: Funcionando corretamente

### Exemplo de Teste:
```bash
# Registro
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@etchi.com",
    "password": "1234567890",
    "name": "Test User",
    "phone": "+244923456789",
    "role": "client"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@etchi.com",
    "password": "1234567890"
  }'
```

## Arquivos Modificados

- `backend/src/services/auth.service.ts`
  - Removido hash manual da senha no método `registerUser`
  - Removidos logs de debug do método `validateUser`

## Status

✅ **PROBLEMA RESOLVIDO**

O login agora funciona corretamente. Usuários podem se registrar e fazer login com sucesso.

---

*Correção realizada em: 28/11/2025*

