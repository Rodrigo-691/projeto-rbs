# Portal do Patrocinador — Planeta Atlântida

## Estratégia: duas versões
1. **Versão A — Portal completo no Lovable** (demo funcionando ponta a ponta: login, isolamento, upload, histórico, relatório com gráficos).
2. **Versão B — Protótipo de telas** (mesmas telas com dados de exemplo, sem banco), entregue como referência para o time Java construir o servidor em Spring Boot.

A Versão B será criada como um "rascunho" separado deste projeto, para não misturar as duas.

## Ferramentas recomendadas (com IA)
- **Lovable** — telas, login, banco de dados, arquivos e gráficos (Versão A e B).
- **Cursor ou Claude Code** — time Java gerar o back-end Spring Boot a partir do modelo de dados e das telas.
- **ChatGPT/Claude** — escrever testes, documentação da API e o roteiro da apresentação.
- **Gamma ou Canva (com IA)** — montar a apresentação final usando os gráficos exportados do portal.
- **Figma (opcional)** — se o time quiser ajustar o visual antes.

## Versão A — o que será construído

### Acesso
- Login com e-mail e senha. Só e-mails cadastrados pela RBS conseguem entrar (convite).
- Dois perfis: **Admin RBS** e **Admin Patrocinador**.
- Cada patrocinador vê apenas os próprios dados.
- Admin RBS pode ter subníveis (B2B, produção, pesquisa) — começa com um nível só, pronto para crescer.

### Área do Admin RBS
- Lista de patrocinadores (nome, cota, e-mails liberados).
- Cadastrar/editar patrocinador e convidar e-mails.
- Entrar na página de qualquer patrocinador para alimentar as abas.
- Painel geral com indicadores (envios pendentes, prazos).

### Página do Patrocinador — menu com as 7 abas
| Aba | Nesta etapa |
|---|---|
| 1. Perfil do cliente | Completa (dados, cota, plano comercial, documento de ingressos) |
| 2. Aplicações de marca | Esqueleto (envio de MIV/logo e fotos) |
| 3. Mídia e conteúdo | Completa (cliente envia; RBS sobe relatórios e links) |
| 4. Cortesias | Esqueleto |
| 5. Credenciamento | Esqueleto + botão para Open Staff |
| 6. Pesquisa da ativação | Completa (3 perguntas; RBS sobe resultados) |
| 7. Contrato | Esqueleto |

- Abas visíveis conforme a cota (Master, Subcota G, Subcota), definidas por configuração.

### Recursos transversais
- Upload/download de arquivos com tipo e tamanho validados.
- Histórico: quem fez o quê e quando, em cada patrocinador.
- **Relatório**: tela com gráficos (mídia, entregas, pesquisa) e botão para baixar os gráficos em imagem/PDF para usar na apresentação. Os gráficos exatos serão definidos depois; deixo exemplos iniciais.

### Visual
- Identidade do Planeta Atlântida com a logo, cores e fontes que você vai enviar. Até lá, uso um visual provisório.

## Versão B — Protótipo para o time Java
- Mesmas telas e navegação, com dados fictícios.
- Documento com o modelo de dados e lista de endpoints sugeridos, para o time Java seguir.

## Ordem de execução
1. Ativar Lovable Cloud (banco, login, arquivos).
2. Login, perfis e cadastro de patrocinadores.
3. Menu de 7 abas + aba Perfil + upload/download + histórico.
4. Abas 3 e 6 + regras de cota.
5. Relatório com gráficos e exportação.
6. Aplicar identidade visual oficial.
7. Criar a Versão B (protótipo) e o documento para o time Java.

## Pendências com a RBS
- 39 marcas x 31 detalhadas; significado de "MIV"; empresa de pesquisa terá login?; SharePoint/Outlook pode ser simulado?; prazos da entrega.

## Detalhes técnicos
- Tabelas: sponsors, sponsor_members (user ↔ sponsor), user_roles (admin_rbs / sponsor_admin), quota_modules (cota → abas), files (metadados + storage privado), media_items, survey_questions, survey_results, audit_log.
- Toda tabela de dados com sponsor_id e regras de acesso no banco que impedem ver outro patrocinador.
- Arquivos em armazenamento privado com links temporários.
- Histórico gravado automaticamente no banco a cada alteração.
- Gráficos com Recharts; exportação em PNG/PDF.
