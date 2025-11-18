# ⚠️ Instruções para usar npm com sudo

## Problema
Quando você usa `sudo npm run dev`, o `sudo` não preserva as variáveis de ambiente do arquivo `.env` por padrão.

## Soluções

### Opção 1: Não usar sudo (Recomendado)
```bash
npm run dev
```

Se você receber um erro de permissão na porta 3000, você pode:
- Usar uma porta diferente (configure `PORT=3001` no `.env`)
- Ou dar permissão ao Node.js para usar portas baixas

### Opção 2: Usar sudo com preservação de variáveis
```bash
sudo -E npm run dev
```

O flag `-E` preserva as variáveis de ambiente.

### Opção 3: Carregar variáveis explicitamente
```bash
sudo env $(cat .env | xargs) npm run dev
```

### Opção 4: Usar arquivo de service account do Firebase
Em vez de variáveis de ambiente, você pode usar o arquivo JSON:

1. Baixe o arquivo `etchi-platform-firebase-adminsdk-fbsvc-5ea79748fc.json`
2. Coloque-o em `backend/config/firebase-service-account.json`
3. Configure no `.env`:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=./config/firebase-service-account.json
   ```

## Verificação
Para verificar se as variáveis estão sendo carregadas:
```bash
node -e "require('dotenv').config(); console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID || 'MISSING');"
```

