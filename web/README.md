# Etchi Web Frontend

Frontend web da plataforma Etchi construído com **Next.js 16.0.5**, **React 19.2**, TypeScript, Tailwind CSS e shadcn/ui.

## 🎨 Design System

O frontend utiliza as cores da identidade visual da Etchi:
- **Laranja Primário**: `#FF6B35` - Cor vibrante da logo
- **Preto Secundário**: `#1E1E1E` - Fundo da logo
- **Branco**: Para contraste e legibilidade

## 🚀 Tecnologias

- **Next.js 16.0.5** - Framework React com App Router (versão mais recente)
- **React 19.2** - Biblioteca UI (versão mais recente)
- **TypeScript** - Type safety
- **Tailwind CSS** - Estilização utilitária
- **shadcn/ui** - Componentes UI modernos
- **Axios** - Cliente HTTP
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de schemas

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local

# Iniciar servidor de desenvolvimento
npm run dev
```

O frontend estará disponível em `http://localhost:3000`

## 📁 Estrutura do Projeto

```
web/
├── app/                    # App Router (Next.js 16)
│   ├── login/             # Página de login
│   ├── register/          # Página de registro
│   ├── dashboard/         # Dashboard principal
│   ├── deliveries/        # Páginas de entregas
│   ├── profile/           # Perfil do usuário
│   ├── layout.tsx         # Layout raiz
│   └── globals.css        # Estilos globais
├── components/
│   ├── ui/                # Componentes shadcn/ui
│   ├── layout/            # Componentes de layout
│   ├── providers/         # Context providers
│   └── logo.tsx           # Componente da logo
├── lib/
│   ├── api.ts             # Serviços de API
│   └── utils.ts           # Utilitários
├── types/
│   └── index.ts           # TypeScript types
└── middleware.ts          # Middleware de autenticação
```

## 🎯 Funcionalidades

- ✅ Autenticação (Login/Registro)
- ✅ Dashboard com estatísticas
- ✅ Gerenciamento de Entregas
- ✅ Perfil do Usuário
- ✅ Design responsivo
- ✅ Integração com API Backend

## 🎨 Componentes shadcn/ui

Os seguintes componentes estão disponíveis:
- Button
- Input
- Card
- (Mais componentes podem ser adicionados conforme necessário)

Para adicionar mais componentes shadcn/ui:
```bash
npx shadcn-ui@latest add [component-name]
```

## 🔧 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## 📝 Scripts

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run start` - Inicia servidor de produção
- `npm run lint` - Executa linter

## 🎨 Logo e Identidade Visual

A logo Etchi está implementada no componente `Logo` com:
- Três linhas curvas diagonais em laranja
- Texto "etCHI" com "et" em cor padrão e "CHI" em laranja
- Design moderno e minimalista

## ⚡ Novidades do Next.js 16 e React 19

### Next.js 16.0.5
- Melhorias de performance
- Otimizações no App Router
- Suporte completo para React 19

### React 19.2
- JSX Transform automático (não precisa mais importar React)
- Melhorias em Server Components
- Performance otimizada
- Novos hooks e APIs

## 📚 Próximos Passos

- [ ] Adicionar mais componentes shadcn/ui
- [ ] Implementar rastreamento em tempo real
- [ ] Adicionar mapa com localização
- [ ] Sistema de notificações
- [ ] Gerenciamento de endereços
- [ ] Sistema de pagamentos

## 📖 Documentação

- [Next.js 16 Docs](https://nextjs.org/docs)
- [React 19 Docs](https://react.dev)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

**Versões:**
- Next.js: 16.0.5
- React: 19.2.0
- TypeScript: 5.3.3

**Status:** ✅ Frontend atualizado e funcional
