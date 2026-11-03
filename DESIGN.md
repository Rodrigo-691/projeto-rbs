---
name: Portal do Patrocinador Planeta Atlântida
description: Design system unificado com a direção estética do Taste Skill e o rigor mecânico do Impeccable
colors:
  primary: "#03A1D0"
  accent-neon: "#FF3E9A"
  sun-yellow: "#FFF48A"
  earth-accent: "#674522"
  ocean-dark: "#212529"
  neutral-bg: "oklch(0.985 0.006 245)"
  neutral-fg: "oklch(0.262 0.0095 248.19)"
  neutral-card: "oklch(0.998 0.002 245)"
  neutral-border: "oklch(0.9 0.012 240)"
  neutral-muted: "oklch(0.52 0.03 248)"
  destructive: "oklch(0.577 0.245 27.325)"
typography:
  display:
    fontFamily: '"Bricolage Grotesque", "Figtree", ui-sans-serif, system-ui, sans-serif'
    fontSize: "2.5rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: '"Bricolage Grotesque", "Figtree", ui-sans-serif, system-ui, sans-serif'
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: '"Figtree", ui-sans-serif, system-ui, sans-serif'
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: '"Figtree", ui-sans-serif, system-ui, sans-serif'
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0em"
  label:
    fontFamily: '"Figtree", ui-sans-serif, system-ui, sans-serif'
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.02em"
rounded:
  sm: "6px"
  md: "10px"
  lg: "14px"
  xl: "18px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "oklch(0.60 0.13 227.8)"
  button-accent:
    backgroundColor: "{colors.accent-neon}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  card-surface:
    backgroundColor: "{colors.neutral-card}"
    textColor: "{colors.neutral-fg}"
    rounded: "{rounded.lg}"
    padding: "24px"
---

# Design System: Portal do Patrocinador Planeta Atlântida

## Overview

**Creative North Star: "Electric Festival Sanctuary"**

O Portal do Patrocinador é o ponto de encontro entre a energia vibrante do maior festival de música do sul do Brasil e a precisão corporativa de uma ferramenta B2B de alta confiabilidade. O sistema visual afasta-se deliberadamente de templates de IA monótonos e dashboards genéricos de SaaS. Ele celebra a identidade autêntica do festival — através do ciano elétrico (#03A1D0), magenta neon (#FF3E9A), amarelo solar (#FFF48A) e base escura grafite (#212529) — mantendo ao mesmo tempo uma disciplina de layout limpa, legível e focada em tarefas.

O sistema opera em um modelo de **superfície dupla**:
1. **Superfícies Públicas e Autenticação (Modo Persuadir):** Adotam a *Hero Discipline* do Taste Skill — composição contida na viewport sem barras de rolagem órfãs, tipografia ousada com títulos em no máximo duas linhas e fotografia do festival integrada organicamente à arquitetura da tela, sem elementos flutuantes artificiais.
2. **Superfícies Internas e Dashboard (Modo Operar):** Adotam a disciplina de *App Screens* — alta densidade de informação útil, tabelas bem diagramadas, ausência de cartões aninhados redundantes e feedback visual instantâneo para status de prazos, cotas e uploads.

**Key Characteristics:**
- **Identidade Energética sem Poluição:** Uso pontual e calibrado das cores saturadas do festival sobre bases de alto contraste.
- **Tipografia com Caráter:** Contraste marcante entre títulos geométricos em Montserrat e texto de leitura cristalino em Plus Jakarta Sans.
- **Hierarquia por Superfície:** Telas de apresentação causam impacto; telas operacionais facilitam a conclusão rápida de tarefas.
- **Anti-Slop por Padrão:** Proibição de gradientes roxos genéricos de IA, caixas dentro de caixas e fontes de sistema cruas.

## Colors

A paleta é extraída diretamente da identidade oficial do Planeta Atlântida: cores vivas que transmitem juventude, festival e verão, ancoradas por neutros profundos.

### Primary
- **Electric Cyan** (#03A1D0 / `oklch(0.662 0.1284 227.8)`): A cor condutora da ação primária. Utilizada em botões principais, links ativos, destaques de navegação e indicadores de status ativo.

### Secondary
- **Neon Magenta** (#FF3E9A / `oklch(0.678 0.2371 356.87)`): O acento de alta energia do festival. Usado para chamadas especiais, badges de destaque, confirmações comemorativas e detalhes do gradiente sunset.

### Tertiary
- **Sun Yellow** (#FFF48A / `oklch(0.954 0.1282 103.29)`): Luz e alerta solar. Utilizado em avisos de prazo iminente, alertas de atenção e tags de prioridade alta.
- **Earth Bronze** (#674522 / `oklch(0.421 0.0683 64.83)`): Tom terroso que ancora detalhes de contraste e categorias institucionais secundárias.

### Neutral
- **Ocean Dark** (#212529 / `oklch(0.29 0.05 248)`): A base noturna profunda para cabeçalhos, sidebars e texto de alto contraste.
- **Canvas Base** (`oklch(0.985 0.006 245)`): Fundo de tela suave, evitando o branco puro estéril.
- **Surface Card** (`oklch(0.998 0.002 245)`): Superfície dos painéis e tabelas operacionais.
- **Muted Border** (`oklch(0.9 0.012 240)`): Linhas sutis para divisões estruturais.

### Named Rules
**The Festival Pulse Rule.** O ciano elétrico e o magenta neon ocupam no máximo 15% da superfície visual de qualquer tela operacional. Sua força estética existe na raridade e no contraste contra os neutros.

**The No-Slop Violet Rule.** É estritamente proibido o uso de gradientes violeta-azulados genéricos de IA ("AI purple") ou fundos com névoas fluorescentes artificiais. Toda cor viva deve pertencer à paleta declarada do festival.

## Typography

A tipografia estabelece uma distinção clara entre a vibração do evento e a seriedade da gestão comercial.

**Display Font:** Bricolage Grotesque (sans-serif de display com personalidade editorial e presença de festival)  
**Body Font:** Figtree (sans-serif geométrica humanista de alta legibilidade operacional em tabelas e formulários)  

**Character:** Bricolage Grotesque garante impacto imediato nas superfícies públicas; Figtree assegura clareza e precisão B2B nas telas operacionais.

### Hierarchy
- **Display** (Bold 700, 2.5rem, line-height 1.15, letter-spacing -0.02em): Chamadas principais da tela de autenticação e boas-vindas do portal.
- **Headline** (Bold 700, 1.75rem, line-height 1.2, letter-spacing -0.02em): Títulos de abas e seções principais (ex: "Mídia & Materiais", "Credenciamento").
- **Title** (SemiBold 600, 1.25rem, line-height 1.3, letter-spacing -0.01em): Títulos de módulos, modais e cabeçalhos de cartões.
- **Body** (Regular 400, 0.9375rem, line-height 1.5): Textos explicativos, instruções de upload e descrições.
- **Label** (Medium 500, 0.8125rem, line-height 1.4, letter-spacing 0.02em): Rótulos de formulário, cabeçalhos de colunas e tags de status.

### Named Rules
**The Anti-Inter Rule.** É proibido regredir para fontes de sistema padrão não-curadas (como Inter padrão ou Arial) sem aprovação expressa. A identidade visual do portal apoia-se no duo Bricolage Grotesque + Figtree.

**The Two-Line Headline Rule.** Em telas de apresentação e cabeçalhos desktop, nenhum título principal deve ultrapassar duas linhas de quebra de texto.

## Layout

O layout equilibra a clareza da arquitetura de informações com a ergonomia de trabalho diário.

- **Superfícies Públicas (Auth / Entrada):**
  - Bloqueio rígido na viewport (`min-h-screen` com contenção de rolagem vertical falsa no desktop).
  - Assimetria bem ponderada: composição dividida entre um painel de autenticação focado e um painel imersivo do festival.
  - Fotografia oficial do evento ancorada e sem elementos soltos ou badges desconectados por cima de fotos.

- **Superfícies Internas (Dashboard & Abas de Patrocinador):**
  - Contêiner máximo centralizado de 1280px (`max-w-7xl px-4 sm:px-6 lg:px-8`).
  - Navegação superior fixa e consistente via `PortalHeader` e menu de abas em `TABS`.
  - Grid de dados em 12 colunas ou layout mestre-detalhe (2 colunas 1:2 para formulários e pré-visualizações).
  - Densidade pensada para dados: tabelas com padding vertical de 12px por linha, facilitando escaneamento rápido.

## Elevation & Depth

O sistema prioriza superfícies limpas e planas em repouso, utilizando elevação sutil apenas para foco e profundidade hierárquica.

### Shadow Vocabulary
- **Shadow Ambient Soft** (`0 10px 30px -12px color-mix(in oklab, var(--ocean) 25%, transparent)`): Usada em cartões de destaque e modais flutuantes.
- **Shadow Focus Rim** (`0 0 0 2px var(--color-background), 0 0 0 4px var(--color-primary)`): Anel de foco acessível em campos e botões acionados por teclado.

### Named Rules
**The Flat-at-Rest Rule.** Painéis, cartões e tabelas são planos em estado de repouso, delimitados por bordas finas de 1px (`neutral-border`). Sombras suaves surgem exclusivamente como resposta a interações de foco, hover ou sobreposição de diálogos modais.

## Shapes

- **Raio de Borda (Corner Radius):**
  - Elementos pequenos (badges, botões de ação compactos): `6px` (`rounded-sm`).
  - Botões padrão e inputs: `10px` (`rounded-md`).
  - Cartões e contêineres principais: `14px` (`rounded-lg`).
  - Diálogos modais: `18px` (`rounded-xl`).
  - Badges de status: `rounded-full` para formato pílula orgânico.

### Named Rules
**The No-Box-In-Box Rule.** É terminantemente proibido aninhar caixas dentro de caixas ("um Card dentro de outro Card com a mesma borda"). O agrupamento secundário é feito através de espaço em branco (`gap`), divisores de 1px ou sutil variação tonal de fundo.

## Components

### Buttons
- **Shape:** Raio médio de 10px (`rounded-md`), altura padrão de 36px (`h-9 px-4`).
- **Primary:** Fundo Electric Cyan (#03A1D0), texto branco puro, hover com escurecimento de 10%, sem sombras pesadas.
- **Accent:** Fundo Neon Magenta (#FF3E9A), texto branco, reservado para ações de destaque especial (ex: "Enviar Material para Aprovação").
- **Secondary / Outline:** Borda de 1px em `neutral-border`, fundo transparente, hover com preenchimento sutil.
- **Ghost:** Sem borda e sem fundo em repouso, ganha fundo muted no hover.

### Cards / Containers
- **Estrutura:** Fundo `neutral-card`, borda sutil de 1px `neutral-border`, padding generoso de 24px (`p-6`).
- **Cabeçalho:** `CardHeader` com título em semi-bold e descrição opcional de no máximo duas linhas.
- **Conteúdo:** Separação limpa sem divisórias desnecessárias.

### Inputs & Selects
- **Estrutura:** Altura padrão 36px (`h-9`), borda de 1px `neutral-border`, fundo `neutral-bg`.
- **Foco:** Anel suave de Electric Cyan (#03A1D0) com transição de 150ms.
- **Estado de Erro:** Borda destrutiva com mensagem em texto de apoio em tamanho label (13px).

### Navigation & TabGate
- **Barra de Abas:** Alinhamento horizontal limpo; a aba ativa possui indicador de borda inferior em Electric Cyan (#03A1D0) e tipografia com peso semi-bold.
- **Acesso Bloqueado:** Telas restritas por cota mostram visual acolhedor e explicativo sobre como fazer upgrade de plano comercial.

## Do's and Don'ts

### Do:
- **Do** manter títulos principais em no máximo 2 linhas no desktop.
- **Do** usar a combinação oficial Bricolage Grotesque (display público) + Figtree (corpo e interface operacional).
- **Do** restringir cores saturadas (#03A1D0 e #FF3E9A) a no máximo 15% da área útil em telas operacionais.
- **Do** manter a tela de login contida na viewport sem barras de rolagem artificiais em telas desktop comuns.
- **Do** utilizar divisores ou espaçamento em vez de aninhar múltiplos cartões com bordas.
- **Do** testar o contraste de todas as combinações de cores conforme o padrão WCAG 2.1 AA.

### Don't:
- **Don't** utilizar fontes genéricas sem curadoria (ex: Inter crua ou Arial padrão de sistema).
- **Don't** utilizar gradientes violeta/roxo clichês de inteligência artificial.
- **Don't** colocar cartões com bordas e sombras dentro de outros cartões já delimitados ("box-in-box slop").
- **Don't** colocar badges, tags ou labels soltos flutuando em cima de fotos sem ancoragem estrutural.
- **Don't** quebrar a navegação e regras de RLS do banco: todo componente deve respeitar o `useSponsorTabAccess`.
