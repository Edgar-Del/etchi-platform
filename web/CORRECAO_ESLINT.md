# Correção de Conflito ESLint - Next.js 16

## 🔴 Problema Identificado

O `eslint-config-next@16.0.5` requer `eslint@>=9.0.0`, mas estava configurado `eslint@^8.57.1`.

## ✅ Solução Aplicada

Atualizado o ESLint para a versão 9.18.0:

```json
"eslint": "^9.18.0"
```

## 📝 Notas Importantes

### ESLint 9 - Mudanças Principais

1. **Flat Config (Opcional)**
   - ESLint 9 introduziu o novo formato "flat config"
   - O Next.js 16 ainda suporta o formato antigo (`.eslintrc.json`)
   - Não é necessário migrar para `eslint.config.js` imediatamente

2. **Compatibilidade**
   - `eslint-config-next@16.0.5` funciona com ESLint 9
   - O formato `.eslintrc.json` ainda é suportado
   - Se houver problemas, pode ser necessário migrar para flat config

### Instalação

```bash
cd web
npm install
```

Se ainda houver problemas, tente:

```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Verificação

Após instalar, verifique:

```bash
npm run lint
```

---

**Status:** ✅ ESLint atualizado para versão 9.18.0

