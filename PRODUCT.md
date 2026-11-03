# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Patrocinadores (Sponsor Members / Gestores de Marca):** Profissionais de marketing e eventos das marcas parceiras do Planeta Atlântida. Precisam gerenciar suas contrapartidas contratuais de forma autônoma, segura e dentro dos prazos do festival (envio de peças de mídia, solicitação de cortesias, envio de dados de credenciamento da equipe de ativação, consulta a contratos e visualização de relatórios pós-evento).
- **Administradores (Equipe Comercial e Operações do Festival):** Responsáveis por cadastrar patrocinadores, vincular cotas comerciais (`quota_modules`), auditar entregas e validar documentos submetidos.

## Product Purpose

Oferecer um portal B2B self-service confiável e centralizado que automatize e profissionalize a jornada operacional e documental dos patrocinadores do Planeta Atlântida, reduzindo atritos de comunicação, eliminando trocas de e-mails dispersas e garantindo conformidade nas entregas contratuais.

## Positioning

Diferente de sistemas genéricos de atendimento ou de compartilhamento de arquivos em nuvem, o Portal do Patrocinador do Planeta Atlântida integra em um único ambiente o controle rigoroso por cotas comerciais no banco de dados (RLS), o upload rastreado de materiais com auditoria imutável por gatilhos de banco, e módulos operacionais feitos sob medida para a logística do maior festival do sul do Brasil.

## Operating Context

- Operação em ambiente corporativo/desktop primário por equipes de marketing e produção, com necessidade de suporte responsivo em dispositivos móveis durante os dias do festival.
- Prazos e marcos operacionais críticos para envio de artes gráficas, vídeos de telão, crachás de credenciamento e cortesias para ativações.
- Manuseio de documentos sensíveis (contratos comerciais, relatórios de audiência, listas nominais de credenciamento).

## Capabilities and Constraints

- **Isolamento de Dados e RLS:** Toda tabela de dados de patrocinador contém obrigatoriamente `sponsor_id` e políticas de RLS atreladas a `can_access_sponsor()`.
- **Acesso Condicional por Cotas:** A visibilidade de abas e dados é estritamente condicionada pelas cotas de patrocínio (`quota_modules` e `quota_allows(sponsor_id, tab_key)`).
- **Armazenamento Seguro:** Arquivos armazenados no bucket privado Supabase `sponsor-files/{sponsor_id}/...`, servidos exclusivamente via URLs assinadas de curta duração.
- **Trilha de Auditoria:** Triggers automáticos no banco (`log_change`) registram histórico em todas as alterações e uploads.
- **Stack Tecnológica:** TanStack Start / React Router, TypeScript, Vite, TailwindCSS, Supabase (PostgreSQL, Auth e Storage) e Drizzle ORM.

## Brand Commitments

- **Identidade do Festival:** Inspirada no universo vibrante do festival Planeta Atlântida.
- **Paleta Desejável (Não obrigatória, prioritária quando aplicável):**
  - Azul Elétrico: `#03A1D0`
  - Rosa/Magenta Neon: `#FF3E9A`
  - Grafite/Base Escura: `#212529`
  - Marrom Terroso/Acento: `#674522`
  - Amarelo Solar: `#FFF48A`
- **Ativos de Marca:** Logo/ícone oficial do Planeta Atlântida disponível em `src/assets/planeta-atlantida-icon.png.asset.json` e `public/favicon.png`.
- **Flexibilidade:** Liberdade para reformulações visuais e explorações estéticas limpas e funcionais nas próximas etapas, preservando a usabilidade B2B.

## Evidence on Hand

- Código-fonte completo e estruturado com rotas do TanStack Router em `src/routes/`.
- Componentes de domínio de patrocinador em `src/components/` (`NewSponsor.tsx`, `TabGate.tsx`, `FileSection.tsx`, `MaterialAttachment.tsx`).
- Migrações SQL e regras de RLS ativas em `supabase/migrations/`.
- Esquema Drizzle tipado em `drizzle/schema.ts` e tipos Supabase em `src/integrations/supabase/types.ts`.

## Product Principles

1. **Acesso Guiado por Cotas:** O que a marca contratou dita exatamente o que a interface exibe; dados inacessíveis são barrados no banco de dados e nunca apenas ocultados visualmente.
2. **Auditoria e Confiança Operacional:** Todo upload, alteração e status de aprovação tem registro persistente e claro para ambas as partes (festival e marca).
3. **Clareza e Agilidade B2B:** Interfaces diretas, sem burocracia desnecessária, focadas em resolver tarefas críticas antes dos prazos do evento.
4. **Resiliência e Segurança de Dados:** Falhas parciais (como interrupção em upload) nunca duplicam entidades e dados privados de patrocinadores são totalmente isolados.

## Accessibility & Inclusion

- Conformidade com padrões WCAG 2.1 AA para contraste em telas com tema escuro e elementos informativos.
- Estados de foco e navegação clara por teclado em formulários de submissão e tabelas de credenciamento.
