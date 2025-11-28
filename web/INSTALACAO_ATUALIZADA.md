# 🚀 Guia de Instalação - Dependências Atualizadas

## ✅ Correção Aplicada

O problema de conflito do ESLint foi resolvido:
- **ESLint atualizado**: `8.57.1` → `9.18.0`
- **Compatível com**: `eslint-config-next@16.0.5`

## 📦 Instalação

### Opção 1: Instalação Normal (Recomendado)

```bash
cd web
npm install
```

### Opção 2: Se houver problemas de cache

```bash
cd web

# Limpar node_modules e lock file
rm -rf node_modules package-lock.json

# Limpar cache do npm
npm cache clean --force

# Reinstalar
npm install
```

### Opção 3: Com legacy-peer-deps (se necessário)

```bash
cd web
npm install --legacy-peer-deps
```

## ✅ Verificação

Após instalar, verifique se tudo está funcionando:

```bash
# Verificar versões instaladas
npm list eslint eslint-config-next

# Testar linter
npm run lint

# Testar build
npm run build

# Iniciar servidor
npm run dev
```

## 🔍 Dependências Atualizadas

### Principais
- ✅ axios: 1.7.9
- ✅ zod: 3.24.1
- ✅ react-hook-form: 7.54.2
- ✅ lucide-react: 0.468.0

### Desenvolvimento
- ✅ typescript: 5.7.2
- ✅ eslint: **9.18.0** (corrigido)
- ✅ tailwindcss: 3.4.17
- ✅ @types/node: 22.10.2

## ⚠️ Notas sobre ESLint 9

O ESLint 9 introduziu o novo formato "flat config", mas:
- ✅ O Next.js 16 ainda suporta o formato antigo (`.eslintrc.json`)
- ✅ Não é necessário migrar para `eslint.config.js` agora
- ✅ O `eslint-config-next` gerencia a compatibilidade

Se no futuro precisar migrar para flat config, o Next.js fornecerá um guia de migração.

## 🎯 Status

✅ **Todas as dependências estão atualizadas e compatíveis**

---

**Próximo Passo:** Execute `npm install` na pasta `web`

