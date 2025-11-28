# Frontend Etchi - Setup Completo

## ✅ Estrutura Criada com Next.js + shadcn/ui

O frontend foi completamente recriado usando **Next.js 14** com **shadcn/ui** e integração com a identidade visual da Etchi.

## 🎨 Identidade Visual Implementada

### Logo Etchi
- Componente `Logo` criado com:
  - Três linhas curvas diagonais em laranja (`#FF6B35`)
  - Texto "etCHI" com "et" em cor padrão e "CHI" em laranja
  - Design moderno e minimalista

### Cores do Design System
- **Primário (Laranja)**: `#FF6B35` - Cor vibrante da logo
- **Secundário (Preto)**: `#1E1E1E` - Fundo da logo
- **Branco**: Para contraste e legibilidade

## 📦 Tecnologias Utilizadas

- ✅ **Next.js 14** - Framework React com App Router
- ✅ **TypeScript** - Type safety completo
- ✅ **Tailwind CSS** - Estilização utilitária
- ✅ **shadcn/ui** - Componentes UI modernos e acessíveis
- ✅ **Axios** - Cliente HTTP para API
- ✅ **React Hook Form** - Gerenciamento de formulários
- ✅ **Zod** - Validação de schemas

## 📁 Estrutura de Arquivos

```
web/
├── app/                          # App Router (Next.js 14)
│   ├── login/                   # Página de login
│   ├── register/                # Página de registro
│   ├── dashboard/               # Dashboard principal
│   │   ├── page.tsx
│   │   └── layout.tsx
│   ├── deliveries/              # Páginas de entregas
│   │   ├── page.tsx
│   │   ├── new/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── profile/                 # Perfil do usuário
│   │   ├── page.tsx
│   │   └── layout.tsx
│   ├── layout.tsx               # Layout raiz
│   ├── page.tsx                 # Página inicial (redirect)
│   └── globals.css              # Estilos globais
├── components/
│   ├── ui/                      # Componentes shadcn/ui
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   └── card.tsx
│   ├── layout/
│   │   └── main-layout.tsx      # Layout principal com navbar
│   ├── providers/
│   │   └── auth-provider.tsx    # Context de autenticação
│   └── logo.tsx                 # Componente da logo Etchi
├── lib/
│   ├── api.ts                   # Serviços de API
│   └── utils.ts                 # Utilitários (cn function)
├── types/
│   └── index.ts                 # TypeScript types
├── middleware.ts                # Middleware Next.js
├── tailwind.config.ts           # Config Tailwind com cores Etchi
├── components.json              # Config shadcn/ui
└── package.json
```

## 🚀 Como Instalar e Executar

### 1. Instalar Dependências

```bash
cd web
npm install
```

**Se houver problemas de permissão:**
```bash
sudo chown -R $(whoami) ~/.npm
npm install
```

### 2. Instalar tailwindcss-animate (se necessário)

```bash
npm install tailwindcss-animate
```

### 3. Iniciar Servidor

```bash
npm run dev
```

O frontend estará disponível em `http://localhost:3000`

## 🎯 Funcionalidades Implementadas

### ✅ Autenticação
- Login com email e senha
- Registro de novos usuários (clientes e entregadores)
- Proteção de rotas
- Gerenciamento de tokens JWT
- Logout

### ✅ Páginas Principais
- **Dashboard** - Visão geral com estatísticas
- **Entregas** - Lista de todas as entregas
- **Nova Entrega** - Formulário para criar entrega
- **Perfil** - Informações do usuário

### ✅ Componentes UI
- Button (com variantes)
- Input (com ícones)
- Card (com header, content, footer)
- Logo Etchi

### ✅ Integração
- Serviços de API configurados
- Interceptors para autenticação
- Tratamento de erros
- Integração completa com backend

## 🎨 Design System

### Cores Principais
```css
Primary: #FF6B35 (Laranja vibrante)
Secondary: #1E1E1E (Preto)
Background: Branco/Cinza claro
```

### Componentes shadcn/ui
Todos os componentes seguem o design system do shadcn/ui com customização das cores da Etchi.

## 📝 Próximos Passos

Para expandir o frontend:

1. **Adicionar mais componentes shadcn/ui:**
   ```bash
   npx shadcn-ui@latest add dialog
   npx shadcn-ui@latest add dropdown-menu
   npx shadcn-ui@latest add toast
   ```

2. **Implementar funcionalidades:**
   - Rastreamento em tempo real
   - Mapa com localização
   - Notificações
   - Gerenciamento de endereços
   - Sistema de pagamentos

3. **Melhorias de UX:**
   - Loading states
   - Error boundaries
   - Toast notifications
   - Confirmações de ações

## 🔧 Configuração

### Variáveis de Ambiente

O arquivo `.env.local` está configurado com:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### Adicionar Componentes shadcn/ui

Para adicionar novos componentes:
```bash
npx shadcn-ui@latest add [component-name]
```

Componentes recomendados:
- `dialog` - Modais
- `dropdown-menu` - Menus dropdown
- `toast` - Notificações
- `select` - Seletores
- `textarea` - Áreas de texto
- `badge` - Badges/etiquetas

## 📚 Documentação

- [Next.js](https://nextjs.org/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

**Status:** ✅ Frontend completo criado com Next.js e shadcn/ui, usando identidade visual da Etchi

