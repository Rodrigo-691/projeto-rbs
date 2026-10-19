# Separação dos conteúdos de mídia

- Manter a linha do tempo de mídia apenas com veiculações e posts registrados pela equipe RBS.
- Mostrar textos enviados em uma lista de materiais separada, junto à seção de arquivos enviados, disponível ao patrocinador correspondente e à equipe RBS.
- Permitir ao patrocinador excluir seus próprios textos e arquivos, preservando as publicações RBS e o isolamento entre patrocinadores.
- Preservar os dados atuais e os registros de histórico.

## Detalhes técnicos
- Reutilizar `media_items.kind = material` e `sponsor_files`, sem criar tabelas ou duplicar registros.
- Ajustar a política de exclusão de `media_items` para permitir materiais próprios; manter as regras existentes de arquivos.
- Adicionar testes para a separação de materiais/publicações e para as condições de exclusão.