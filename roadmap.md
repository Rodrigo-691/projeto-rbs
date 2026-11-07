# Roadmap

- [ ] Remover cadastro manual de publicações e adicionar respostas RBS com texto e comprovação por material, mantendo publicações existentes para consulta.

- [x] Planilha padronizada de mídia (Patrocinador, Data, Veículo, Alcance) com vários patrocinadores, importada no painel RBS direto para os relatórios — testes passaram; importação com conta real não verificada

- [x] Exceções de abas por patrocinador (regras individuais + controles no Perfil para RBS) — testes passaram; conferência com conta conectada não feita

- [x] Unificar controle das abas por cota e impedir Pesquisa para Subcota e Subcota G no menu e no acesso direto — testes passaram e proteção no banco confirmada; teste visual com conta patrocinadora indisponível no Supabase externo

- [x] Identificar cadastro e envio do plano comercial no histórico do patrocinador, mantendo os acessos existentes — registros reais e teste transacional confirmados no banco; conferência visual autenticada indisponível no Supabase externo

- [x] Abrir formulário completo para novo patrocinador e anexar plano comercial no cadastro — testes passaram; envio com conta real não verificado no Supabase externo

- [x] Reunir título, texto e anexo em um único envio e item de material, preservando materiais antigos — testes passaram; conferência com conta conectada indisponível neste Supabase externo

- [x] Separar materiais enviados da linha do tempo RBS e permitir excluir conteúdos próprios com isolamento por patrocinador

- [x] Login, perfis, isolamento, cadastro de patrocinadores
- [x] Menu 7 abas, Perfil, Mídia, Pesquisa, upload/download, histórico
- [x] Relatório com gráficos (PNG/PDF)
- [x] Identidade visual oficial aplicada — cores, logo, ícone e Montserrat (aguardando revisão do usuário)
- [x] Banco no Supabase do cliente (ref tsnolyvatlustxpqfrhg) — estrutura, regras de acesso, abas por cota e armazenamento restaurados no novo banco
- [ ] Versão B (protótipo para time Java) — em rascunho separado
- [ ] Conteúdo completo de Cortesias e Credenciamento
- [ ] Gráficos definitivos do relatório — aguardando definição do usuário
