# Configuração de Autenticação Git para GitHub

## Problema
GitHub não aceita mais autenticação por senha via HTTPS. É necessário usar:
- **SSH** (recomendado) ou
- **Personal Access Token (PAT)**

## Solução 1: Usar SSH (Recomendado)

### Passo 1: Verificar se já tem chave SSH
```bash
ls -la ~/.ssh/id_*.pub
```

### Passo 2: Gerar nova chave SSH (se não tiver)
```bash
ssh-keygen -t ed25519 -C "seu-email@example.com"
```
Pressione Enter para aceitar o local padrão e defina uma senha (opcional).

### Passo 3: Adicionar chave ao ssh-agent
```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

### Passo 4: Copiar chave pública
```bash
cat ~/.ssh/id_ed25519.pub
```
Copie toda a saída.

### Passo 5: Adicionar chave no GitHub
1. Acesse: https://github.com/settings/keys
2. Clique em "New SSH key"
3. Cole a chave pública
4. Salve

### Passo 6: Alterar remote para SSH
```bash
cd /Users/edgartchissingui/Documents/PLP/FinalProject/etchi-platform
git remote set-url origin git@github.com:Edgar-Del/etchi-platform.git
```

### Passo 7: Testar conexão
```bash
ssh -T git@github.com
```

### Passo 8: Fazer push
```bash
git push origin master
```

## Solução 2: Usar Personal Access Token (PAT)

### Passo 1: Criar Token no GitHub
1. Acesse: https://github.com/settings/tokens
2. Clique em "Generate new token" > "Generate new token (classic)"
3. Dê um nome (ex: "etchi-platform")
4. Selecione escopos: `repo` (acesso completo a repositórios)
5. Clique em "Generate token"
6. **COPIE O TOKEN** (você só verá uma vez!)

### Passo 2: Usar token no push
```bash
git push https://SEU_TOKEN@github.com/Edgar-Del/etchi-platform.git master
```

Ou configurar para sempre usar o token:
```bash
git remote set-url origin https://SEU_TOKEN@github.com/Edgar-Del/etchi-platform.git
```

### Passo 3: Fazer push
```bash
git push origin master
```

## Solução 3: Usar GitHub CLI (gh)

### Instalar GitHub CLI
```bash
brew install gh
```

### Autenticar
```bash
gh auth login
```

### Fazer push normalmente
```bash
git push origin master
```

## Recomendação

**Use SSH** - É mais seguro e conveniente a longo prazo. Você só configura uma vez e funciona para sempre.

