# 🔧 Troubleshooting - Conexão MongoDB

## Erro: `ETIMEOUT cluster0.0hyepk0.mongodb.net`

Este erro indica que a aplicação não consegue conectar ao MongoDB Atlas. Aqui estão as soluções:

## ✅ Soluções Passo a Passo

### 1. Verificar Conectividade de Rede

Teste se consegue acessar o MongoDB Atlas:

```bash
# Testar DNS
nslookup cluster0.0hyepk0.mongodb.net

# Testar conectividade
ping cluster0.0hyepk0.mongodb.net
```

### 2. Verificar IP na Whitelist do MongoDB Atlas

**Passo a passo:**

1. Acesse [MongoDB Atlas](https://cloud.mongodb.com/)
2. Vá em **Network Access** (ou **Security** → **Network Access**)
3. Clique em **Add IP Address**
4. Para desenvolvimento local, adicione:
   - **Opção 1 (Recomendado para dev):** `0.0.0.0/0` (permite todos os IPs)
   - **Opção 2 (Mais seguro):** Seu IP atual (veja em [whatismyip.com](https://www.whatismyip.com/))
5. Clique em **Confirm**

**⚠️ Importante:** Pode levar alguns minutos para as mudanças entrarem em vigor.

### 3. Verificar Credenciais

1. No MongoDB Atlas, vá em **Database Access**
2. Verifique se o usuário `etchiplatform` existe e está ativo
3. Verifique se a senha está correta
4. Se necessário, crie um novo usuário ou redefina a senha

### 4. Verificar String de Conexão

A string de conexão no `.env` deve estar no formato:

```env
MONGODB_URI=mongodb+srv://username:password@cluster0.0hyepk0.mongodb.net/database?retryWrites=true&w=majority
```

**Verifique:**
- ✅ Username e password estão corretos
- ✅ Nome do cluster está correto (`cluster0.0hyepk0`)
- ✅ Não há espaços extras na string
- ✅ A string está entre aspas se necessário

### 5. Usar MongoDB Local como Fallback

Se o MongoDB Atlas não estiver acessível, você pode usar MongoDB local:

```bash
# Instalar MongoDB local (macOS)
brew tap mongodb/brew
brew install mongodb-community

# Iniciar MongoDB
brew services start mongodb-community

# Ou manualmente
mongod --config /usr/local/etc/mongod.conf
```

No `.env`, use:
```env
MONGODB_URI=mongodb://localhost:27017/etchi_db
```

### 6. Verificar Firewall/Proxy

Se estiver em uma rede corporativa ou com firewall:

- Verifique se a porta 27017 está aberta (MongoDB local)
- Para MongoDB Atlas, verifique se não há bloqueio de conexões HTTPS/SSL
- Se usar proxy, configure o Node.js para usar o proxy

### 7. Testar Conexão Manualmente

```bash
# Instalar MongoDB Shell (mongosh)
npm install -g mongosh

# Testar conexão
mongosh "mongodb+srv://etchiplatform:qzqsaSVLjoUBnRtw@cluster0.0hyepk0.mongodb.net/?retryWrites=true&w=majority"
```

## 🔄 Solução Temporária: Usar MongoDB Local

Se precisar continuar desenvolvendo enquanto resolve o problema do Atlas:

1. **Instalar MongoDB local:**
   ```bash
   # macOS
   brew install mongodb-community
   brew services start mongodb-community
   
   # Linux
   sudo apt-get install mongodb
   sudo systemctl start mongodb
   
   # Windows
   # Baixe do site oficial: https://www.mongodb.com/try/download/community
   ```

2. **Atualizar `.env`:**
   ```env
   MONGODB_URI=mongodb://localhost:27017/etchi_db
   ```

3. **Reiniciar o servidor:**
   ```bash
   npm run dev
   ```

## 📝 Checklist de Verificação

- [ ] IP está na whitelist do MongoDB Atlas
- [ ] Credenciais estão corretas
- [ ] String de conexão está correta
- [ ] Conexão com internet está funcionando
- [ ] Firewall não está bloqueando
- [ ] MongoDB Atlas cluster está ativo (não pausado)

## 🆘 Ainda com Problemas?

1. **Verifique os logs do MongoDB Atlas:**
   - Vá em **Monitoring** → **Logs** no MongoDB Atlas
   - Procure por tentativas de conexão falhadas

2. **Teste com outro cliente:**
   - Use MongoDB Compass ou Studio 3T
   - Se funcionar, o problema pode ser na aplicação

3. **Contate o suporte do MongoDB Atlas:**
   - Se o cluster estiver pausado, você precisa ativá-lo
   - Verifique se há limites de uso atingidos

## 💡 Dica

Para desenvolvimento, considere usar MongoDB local que é mais rápido e não depende de internet:

```env
MONGODB_URI=mongodb://localhost:27017/etchi_db
```

Para produção, use MongoDB Atlas com IPs específicos na whitelist para segurança.

