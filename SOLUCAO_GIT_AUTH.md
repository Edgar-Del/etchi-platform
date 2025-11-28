# Solução para Autenticação Git no GitHub

## ⚠️ Problema
GitHub não aceita mais autenticação por senha. Você precisa usar SSH ou Personal Access Token.

## 🚀 Solução Rápida

### Opção 1: Usar o Script Automático (Mais Fácil)

Execute o script que criei:
```bash
./setup-git-auth.sh
```

O script vai guiá-lo através do processo.

### Opção 2: Configuração Manual SSH (Recomendado)

#### 1. Gerar chave SSH
```bash
ssh-keygen -t ed25519 -C "seu-email@github.com"
```
(Pressione Enter para aceitar o local padrão)

#### 2. Adicionar chave ao ssh-agent
```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

#### 3. Copiar chave pública
```bash
cat ~/.ssh/id_ed25519.pub
```
Copie toda a saída.

#### 4. Adicionar no GitHub
1. Acesse: https://github.com/settings/keys
2. Clique em "New SSH key"
3. Cole a chave
4. Salve

#### 5. Alterar remote para SSH
```bash
cd /Users/edgartchissingui/Documents/PLP/FinalProject/etchi-platform
git remote set-url origin git@github.com:Edgar-Del/etchi-platform.git
```

#### 6. Testar e fazer push
```bash
ssh -T git@github.com
git push origin master
```

### Opção 3: Usar Personal Access Token

#### 1. Criar Token no GitHub
1. Acesse: https://github.com/settings/tokens
2. "Generate new token" > "Generate new token (classic)"
3. Nome: "etchi-platform"
4. Escopo: `repo` (marcar)
5. "Generate token"
6. **COPIE O TOKEN** (só aparece uma vez!)

#### 2. Configurar remote com token
```bash
cd /Users/edgartchissingui/Documents/PLP/FinalProject/etchi-platform
git remote set-url origin https://SEU_TOKEN@github.com/Edgar-Del/etchi-platform.git
```

#### 3. Fazer push
```bash
git push origin master
```

## 📝 Comandos Úteis

### Ver remote atual
```bash
git remote -v
```

### Alterar para SSH
```bash
git remote set-url origin git@github.com:Edgar-Del/etchi-platform.git
```

### Alterar para HTTPS com token
```bash
git remote set-url origin https://TOKEN@github.com/Edgar-Del/etchi-platform.git
```

## ✅ Recomendação

**Use SSH** - É mais seguro, você configura uma vez e funciona para sempre. Não precisa digitar token a cada push.

---

**Status:** Aguardando configuração de autenticação

