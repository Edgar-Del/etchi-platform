#!/bin/bash

# Script para configurar autenticação Git com GitHub
# Escolha entre SSH ou Personal Access Token

echo "=========================================="
echo "  Configuração de Autenticação Git"
echo "=========================================="
echo ""
echo "Escolha o método de autenticação:"
echo "1) SSH (Recomendado - mais seguro)"
echo "2) Personal Access Token (PAT)"
echo ""
read -p "Digite sua escolha (1 ou 2): " choice

case $choice in
  1)
    echo ""
    echo "=== Configurando SSH ==="
    echo ""
    
    # Verificar se já existe chave
    if [ -f ~/.ssh/id_ed25519.pub ]; then
      echo "✓ Chave SSH já existe!"
      echo ""
      echo "Sua chave pública SSH:"
      cat ~/.ssh/id_ed25519.pub
      echo ""
      echo "Copie a chave acima e adicione no GitHub:"
      echo "https://github.com/settings/keys"
      echo ""
      read -p "Pressione Enter após adicionar a chave no GitHub..."
    else
      # Gerar nova chave
      echo "Gerando nova chave SSH..."
      read -p "Digite seu email do GitHub: " email
      ssh-keygen -t ed25519 -C "$email" -f ~/.ssh/id_ed25519 -N ""
      
      # Adicionar ao ssh-agent
      eval "$(ssh-agent -s)" > /dev/null
      ssh-add ~/.ssh/id_ed25519
      
      echo ""
      echo "✓ Chave SSH gerada!"
      echo ""
      echo "Sua chave pública SSH:"
      cat ~/.ssh/id_ed25519.pub
      echo ""
      echo "Copie a chave acima e adicione no GitHub:"
      echo "https://github.com/settings/keys"
      echo ""
      read -p "Pressione Enter após adicionar a chave no GitHub..."
    fi
    
    # Alterar remote para SSH
    echo ""
    echo "Alterando remote para SSH..."
    cd /Users/edgartchissingui/Documents/PLP/FinalProject/etchi-platform
    git remote set-url origin git@github.com:Edgar-Del/etchi-platform.git
    
    # Testar conexão
    echo ""
    echo "Testando conexão SSH..."
    ssh -T git@github.com 2>&1 | head -1
    
    echo ""
    echo "✓ Configuração SSH concluída!"
    echo ""
    echo "Agora você pode fazer push com:"
    echo "  git push origin master"
    ;;
    
  2)
    echo ""
    echo "=== Configurando Personal Access Token ==="
    echo ""
    echo "1. Acesse: https://github.com/settings/tokens"
    echo "2. Clique em 'Generate new token' > 'Generate new token (classic)'"
    echo "3. Dê um nome (ex: 'etchi-platform')"
    echo "4. Selecione escopo: 'repo' (acesso completo)"
    echo "5. Clique em 'Generate token'"
    echo "6. COPIE O TOKEN (você só verá uma vez!)"
    echo ""
    read -p "Cole seu token aqui: " token
    
    if [ -z "$token" ]; then
      echo "Token não fornecido. Saindo..."
      exit 1
    fi
    
    # Alterar remote para usar token
    echo ""
    echo "Configurando remote com token..."
    cd /Users/edgartchissingui/Documents/PLP/FinalProject/etchi-platform
    git remote set-url origin https://${token}@github.com/Edgar-Del/etchi-platform.git
    
    echo ""
    echo "✓ Token configurado!"
    echo ""
    echo "Agora você pode fazer push com:"
    echo "  git push origin master"
    echo ""
    echo "⚠️  IMPORTANTE: O token está salvo na URL do remote."
    echo "   Para maior segurança, considere usar SSH no futuro."
    ;;
    
  *)
    echo "Opção inválida!"
    exit 1
    ;;
esac

