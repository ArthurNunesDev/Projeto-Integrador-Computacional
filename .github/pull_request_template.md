<!--
Instruções para quem escreve este PR (inclusive com IA). Padrão completo em CONTRIBUTING.md.
- Escreva em português, sem emojis. Título no imperativo, 3ª pessoa (ex.: "Simplifica tela de login").
- Preencha todas as seções. Se uma não se aplica, escreva "Não se aplica" em vez de apagar.
- Uma branch por assunto, nomeada como o título (ex.: simplifica-login). Base: main do repositório principal.
- Liste os arquivos alterados/removidos e o efeito de cada mudança no comportamento do site.
- Diga o que foi testado e o que NÃO foi testado. Não afirme testes que não rodaram.
- Apague este comentário antes de enviar.
-->

## Resumo

<!-- 2 a 4 frases: o que muda e se o visual/funcionamento do site muda. -->

## Por que essas mudanças

<!-- O problema de antes, em tópicos. -->

-

## Mudanças

<!-- Uma subseção por assunto (### 1. ..., ### 2. ...). Cite arquivos com `caminho/relativo`.
Para arquivos removidos, use uma tabela | Arquivo | Motivo |. -->

### 1.

## Como foi verificado

<!-- Marque o que rodou e escreva "não se aplica" no que não se aplica. Diga o que não foi testado. -->

- [ ] `npm run build` sem erros
- [ ] `npm run lint` sem erros novos
- [ ] Testado manualmente no navegador (`npm run dev`)
- [ ] `./mvnw test` passando (em `backend/`)
- [ ] Documentação atualizada (`README.md`, `PROXIMOS_PASSOS.md`), se a mudança afeta o que ela descreve

## Observações (não alteradas neste PR)

<!-- Problemas notados e deixados para depois. -->

-

## Como testar

1. Baixe a branch deste PR.
2. Frontend:
   ```bash
   cd MarketPlace
   npm install
   npm run build
   npm run dev
   ```
3. Backend (se mudou), dentro de `backend/`:
   ```bash
   ./mvnw test
   ./mvnw spring-boot:run
   ```
4. <!-- Passos no navegador ou chamadas à API e o resultado esperado. Apague os passos que não se aplicam. -->
