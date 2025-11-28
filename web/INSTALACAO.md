# Instalação do Frontend Etchi

## Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn

## Passos de Instalação

### 1. Instalar Dependências

```bash
cd web
npm install
```

**Nota:** Se houver problemas de permissão com npm, execute:
```bash
sudo chown -R $(whoami) ~/.npm
```

### 2. Instalar Componentes shadcn/ui Adicionais (Opcional)

Se precisar de mais componentes shadcn/ui:

```bash
npx shadcn-ui@latest add [component-name]
```

Componentes já incluídos:
- Button
- Input
- Card

### 3. Configurar Variáveis de Ambiente

O arquivo `.env.local` já foi criado com a URL padrão da API. Se necessário, edite:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 4. Iniciar Servidor de Desenvolvimento

```bash
npm run dev
```

O frontend estará disponível em `http://localhost:3000`

## Estrutura Criada

✅ Next.js 14 com App Router
✅ TypeScript configurado
✅ Tailwind CSS com tema personalizado (cores da Etchi)
✅ shadcn/ui configurado
✅ Componentes básicos (Button, Input, Card)
✅ Logo Etchi implementada
✅ Sistema de autenticação
✅ Páginas principais (Login, Register, Dashboard, Deliveries, Profile)
✅ Integração com API backend
✅ Middleware de autenticação

## Design System

O frontend utiliza as cores da identidade visual Etchi:
- **Laranja Primário**: `#FF6B35`
- **Preto Secundário**: `#1E1E1E`
- **Branco**: Para contraste

## Próximos Passos

Após instalar as dependências, você pode:

1. Adicionar mais componentes shadcn/ui conforme necessário
2. Implementar funcionalidades adicionais
3. Personalizar o design conforme necessário

---

**Status:** ✅ Estrutura completa criada e pronta para uso

