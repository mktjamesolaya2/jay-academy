# Jay Academy — Portal Admin

Painel administrativo centralizado da Jay Academy. CMS interno pra gerenciar Websites, Landing Pages, Formulários e importação do WordPress legacy.

## Stack

- Next.js 16 (App Router + Turbopack)
- React 19 + TypeScript
- Tailwind v4
- Auth próprio (bcryptjs + jose JWT em cookie)

## Rodar local

```powershell
cd portal
npm install
npm run dev
```

Abre em `http://localhost:4000`.

**Credenciais admin** (criadas automaticamente no primeiro login):
- Email: `suporte@jamesolaya.com.br`
- Senha: `@Suporte123`

## Estrutura

```
portal/
├── app/
│   ├── dashboard/      # Home admin
│   ├── websites/       # Lista de websites
│   ├── lps/            # Lista de landing pages + CRUD
│   ├── forms/          # Formulários (em construção)
│   ├── lixeira/        # Itens deletados
│   ├── wordpress/      # Triagem das 92 páginas WP
│   ├── wp-pages/       # Detalhe + editor visual de páginas WP copiadas
│   ├── login/          # Login
│   ├── cadastro/       # Cadastro novos usuários
│   ├── settings/       # Configurações + link pra lixeira
│   └── api/auth/       # Auth endpoints
├── components/         # Componentes reutilizáveis
├── lib/                # auth, persistence helpers
├── data/               # JSON local (ignorado no git)
├── public/uploads/     # Uploads de imagens (ignorado no git)
└── middleware.ts       # Proteção de rotas
```

## Features principais

- **Auth** com roles (admin/editor/viewer)
- **CRUD** completo de LPs/Websites/Formulários
- **Editor visual** estilo Canva pra páginas WP (drag, resize, styles, camadas, undo)
- **Import WordPress** com triagem das 92 páginas legacy
- **Lixeira** com restaurar e excluir permanente
- **Search ⌘K** global
- **Status** das páginas: Draft/Published/Archived/Deploying/Error

## Deploy

### Local
Tudo funciona via filesystem (`data/*.json` + `public/uploads/`).

### Vercel (limitado por enquanto)
Filesystem é read-only em runtime. Atualmente:
- ✅ Navegar funciona
- ✅ Login funciona (admin hardcoded)
- ❌ Criar/editar/excluir páginas falha
- ❌ Upload de imagens falha
- ❌ Cadastro de novos usuários não persiste

Pra deploy completo, migrar `data/` pra Vercel KV e `uploads/` pra Vercel Blob.

### Env vars necessárias em produção
- `AUTH_SECRET` — secret aleatório pra JWT (32+ chars)

## Próximos passos

- [ ] Migrar persistência pra Vercel KV/Blob
- [ ] Integração GA4 + Meta Pixel
- [ ] Sistema de leads (forms reais)
- [ ] Logs de ação
- [ ] Versionamento de páginas
