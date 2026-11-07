<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Project rules

- New-sponsor dialog keeps the created sponsor ID on upload failure so retries never duplicate it.

- Media helpers separate submitted materials from publications; delete buttons mirror RLS ownership.
- Material attachments link via sponsor_files.media_item_id; unlinked legacy files stay listed.
- RBS replies use media_material_replies with a sponsor/material composite foreign key and private attachment metadata, keeping replies isolated from report publications.
- Routes define own head(); sponsor pages use portalHead.

- The live database is the user's own external Supabase project (currently ref `tsnolyvatlustxpqfrhg`); Lovable cannot mint sessions for it.
- Every sponsor data table carries `sponsor_id`, and RLS uses `can_access_sponsor()` — isolation lives in the database, not the UI.
- Quota → visible tabs is configured in `quota_modules`; `sponsor_tab_overrides` wins over it. Never hardcode quota checks; restricted data is also guarded in RLS via `quota_allows`.
- Menu and gates share `useSponsorTabAccess`; missing data denies access.
- Audit history is written by DB triggers (`log_change`) on every data table; add the trigger when adding a table.
- Audit summaries persist the file category so deleted uploads stay identifiable.
- Files live in the private `sponsor-files` bucket under `{sponsor_id}/...`, metadata in `sponsor_files`, downloads via short-lived signed URLs.
- Sign-up is limited to `admin_emails` / `sponsor_members`; Admin RBS is granted only to emails listed in `admin_emails` (no first-user bootstrap).
- Tab menu definitions live in `src/lib/portal.ts` (`TABS`) so the menu mirrors the commercial plan in one place.
- `drizzle/baseline/` holds schema snapshots for reference only — never apply or edit them; real migrations go through the migration tool.
- `types.ts` describes the target schema; regenerate only after schema changes apply.

## Mapa de Arquivos Funcionais (Navegação Rápida)

Para localizar funcionalidades sem varrer diretórios desnecessários (`node_modules`, `.git`, `.lovable`, etc.):

- **Rotas e Telas (`src/routes/`)**:
  - `src/routes/__root.tsx` (Layout raiz e provedores)
  - `src/routes/index.tsx` (Página inicial)
  - `src/routes/auth.tsx` e `src/routes/reset-password.tsx` (Autenticação)
  - `src/routes/_authenticated/route.tsx` (Guarda de rotas protegidas)
  - `src/routes/_authenticated/painel.tsx` (Painel geral)
  - `src/routes/_authenticated/patrocinador.$id.tsx` e `patrocinador.$id.index.tsx` (Layout e visão geral do patrocinador)
  - Sub-abas do patrocinador: `patrocinador.$id.aplicacoes.tsx`, `.contrato.tsx`, `.cortesias.tsx`, `.credenciamento.tsx`, `.historico.tsx`, `.midia.tsx`, `.pesquisa.tsx`, `.relatorio.tsx`

- **Inicialização e Roteamento (`src/`)**:
  - `src/router.tsx` e `src/routeTree.gen.ts` (Configuração e rotas do TanStack Router)
  - `src/start.ts` e `src/server.ts` (Entrypoints do client e server)

- **Componentes de Domínio (`src/components/`)**:
  - `src/components/TabGate.tsx` (Controle de renderização por cota/aba)
  - `src/components/NewSponsor.tsx` (Cadastro de novo patrocinador)
  - `src/components/FileSection.tsx` (Gestão de uploads/arquivos)
  - `src/components/MaterialAttachment.tsx` (Mídias e anexos vinculados)
  - `src/components/PortalHeader.tsx` (Cabeçalho do portal)
  - *(Componentes genéricos de UI ficam em `src/components/ui/`)*

- **Regras de Negócio e Helpers (`src/lib/`)**:
  - `src/lib/tab-access.ts` (Permissões de abas e cotas - `useSponsorTabAccess`)
  - `src/lib/portal.ts` (Definição dos menus e abas - `TABS`)
  - `src/lib/media.ts` (Classificação e tratamento de mídias/materiais)
  - `src/lib/audit.ts` (Formatação de logs de auditoria)
  - `src/lib/error-capture.ts`, `error-page.ts`, `lovable-error-reporting.ts` (Tratamento de erros)
  - `src/lib/page-head.ts` e `src/lib/utils.ts` (SEO/Metadados e utilitários gerais)

- **Integração Supabase, Auth e Banco de Dados**:
  - `src/integrations/supabase/client.ts` e `client.server.ts` (Clientes Supabase)
  - `src/integrations/supabase/auth-middleware.ts`, `auth-attacher.ts`, `cron-auth.ts` (Middlewares)
  - `src/integrations/supabase/types.ts` (Tipagem gerada do banco)
  - `drizzle/schema.ts` (Esquema Drizzle)
  - `supabase/migrations/*.sql` (Migrações, tabelas, RLS e triggers de banco)

## Árvore de Skills do Projeto (`.agent/skills/`)

- **`impeccable`** (`.agent/skills/impeccable/SKILL.md`):
  - Framework de design e anti-patterns frontend para IA.
  - Auditoria UX/UI, consistência de espaçamentos, tipografia, paletas e polimento de componentes.
  - Comandos e contexto acessíveis via CLI/scripts internos (`impeccable`).

- **`taste-skill` / `design-taste-frontend`** (`.agent/skills/taste-skill/SKILL.md`):
  - Framework de direção de arte anti-slop v2 para interfaces e páginas públicas.
  - Prevenção de layouts clichês ("AI-purple", cards genéricos de 3 colunas), curadoria de direções visuais, paletas autênticas e inspeção em navegador real.


