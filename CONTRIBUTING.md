# Como contribuir

Padrão de branches, commits e pull requests do MarketFaesa. Tudo em português e sem emojis.

## Branches

- Uma branch por assunto, sempre criada a partir da `main` atualizada do repositório principal.
- Nome em minúsculas, palavras separadas por hífen, sem acentos, começando pelo verbo na 3ª pessoa (o mesmo verbo do título do PR).
- Curto: o verbo e o assunto bastam.

| Tipo de mudança | Exemplo |
|---|---|
| Funcionalidade nova | `adiciona-cadastro-api`, `cria-endpoint-health` |
| Correção | `corrige-erro-login` |
| Documentação | `atualiza-documentacao-login` |
| Refatoração ou limpeza | `simplifica-login`, `reorganiza-estrutura` |
| Configuração ou ferramentas | `configura-spring-boot` |

Não faça push direto na `main`: toda mudança entra por PR.

## Commits

- Mensagem em português, no imperativo na 3ª pessoa, com a primeira letra maiúscula e sem ponto final: `Adiciona template de pull request`, `Simplifica tela de login e remove animações e pets`.
- Primeira linha com até ~72 caracteres. Se precisar explicar mais, deixe uma linha em branco e escreva o corpo.
- Um commit por passo lógico (ex.: código em um commit, documentação em outro). Evite commits como `ajustes` ou `wip`.

## Pull requests

Os PRs são abertos a partir de um fork para a `main` do repositório principal, [ArthurNunesDev/Projeto-Integrador-Computacional](https://github.com/ArthurNunesDev/Projeto-Integrador-Computacional).

1. Atualize a partir do repositório principal (remoto `upstream`) e crie a branch:
   ```bash
   git fetch upstream
   git switch -c corrige-erro-login upstream/main
   ```
2. Faça os commits e rode as verificações que se aplicam: `npm run build` e `npm run lint` em `MarketPlace/`, `./mvnw test` em `backend/`.
3. Envie a branch para o seu fork (remoto `origin`):
   ```bash
   git push -u origin corrige-erro-login
   ```
4. Abra o PR com base em `main` do repositório principal:
   ```bash
   gh pr create -R ArthurNunesDev/Projeto-Integrador-Computacional --base main --head <seu-usuario>:corrige-erro-login
   ```
5. **Título**: igual ao estilo dos commits (ex.: `Corrige erro no login`).
6. **Descrição**: preencha o [template](.github/pull_request_template.md), que o GitHub já coloca na descrição: Resumo, Por que essas mudanças, Mudanças, Como foi verificado, Observações e Como testar. Seção que não se aplica fica com "Não se aplica". Diga o que foi e o que não foi testado.
7. **Revisão e merge**: outra pessoa do time revisa e faz o merge (merge commit, pelo botão do GitHub). Depois do merge, a branch pode ser apagada.

Se a mudança altera o que o `README.md` ou o `PROXIMOS_PASSOS.md` descrevem, atualize-os no mesmo PR.

## Exemplo completo

```bash
git fetch upstream
git switch -c cria-endpoint-health upstream/main
# ... código e teste ...
git add backend
git commit -m "Cria endpoint GET /api/health"
git push -u origin cria-endpoint-health
gh pr create -R ArthurNunesDev/Projeto-Integrador-Computacional --base main --head <seu-usuario>:cria-endpoint-health --title "Cria endpoint GET /api/health"
```
