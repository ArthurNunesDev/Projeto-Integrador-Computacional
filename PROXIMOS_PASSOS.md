# Próximos passos

Roadmap do backend e da integração com o frontend. O backend já roda com Spring Boot 4.1 (Java 21+, Maven Wrapper), já conecta ao PostgreSQL (Neon) com migrations do Flyway e já tem os endpoints de health, cadastro, login (JWT), perfil, configurações, catálogos, oportunidades, habilidades publicadas, pessoas, conexões e mensagens (lista no [README](README.md#api)), e todas as telas do front já os usam. Falta hospedar o backend e definir o `VITE_API_URL` de produção.

---

## 1. Evoluir o backend

1. **Ferramenta de build** (feito): Maven com Maven Wrapper (`backend/mvnw`), então ninguém precisa instalar o Maven. As dependências ficam em `backend/pom.xml`.
2. **Framework** (base feita): Spring Boot 4.1 com Spring Web MVC, que já resolve servidor HTTP, JSON, injeção de dependência e CORS, e Spring Security em `config/SecurityConfig.java` (API stateless: `/api/health`, os catálogos, `/api/auth/register` e `/api/auth/login` são públicos, o resto exige `Bearer` e responde `401` no formato de erro; CORS configurável por `CORS_ALLOWED_ORIGINS`, com padrão `http://localhost:5173` e o GitHub Pages; BCrypt para senhas). Starters:
   - `spring-boot-starter-data-jpa`, Flyway e o driver do PostgreSQL já estão no `pom.xml` (banco no Neon, ver item 4);
   - `spring-boot-starter-validation`, usado com `@Valid` nos DTOs de `dto/`;
   - `spring-boot-starter-security-oauth2-resource-server`, que valida o JWT (HS256, `config/JwtConfig.java`).
3. **Camadas** (as pastas já existem em `backend/src/main/java/br/com/marketfaesa/`):
   - `model`: entidades (`Usuario`, `ConfiguracaoUsuario`).
   - `repository`: acesso ao banco das entidades (interfaces `JpaRepository`); os demais domínios consultam com `JdbcClient` nos próprios services.
   - `service`: regras de negócio (cadastro, login, validações).
   - `controller`: endpoints REST, sem regra de negócio.
4. **Banco de dados** (feito): PostgreSQL no Neon em desenvolvimento e produção, configurado por variáveis de ambiente (`DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD` e, opcional, `DATABASE_DIRECT_URL` para o Flyway) ou pelo perfil `local` (`backend/application-local.properties`). O schema vem só das migrations do Flyway (`db/migration/`) e o Hibernate roda com `ddl-auto=validate`. Os testes usam um Postgres embutido (zonky) ou o banco de `TEST_DATABASE_URL`. Detalhes no [README](README.md#banco).
5. **Senhas** (feito): hash BCrypt (bean `PasswordEncoder` em `config/SecurityConfig.java`); nenhuma resposta devolve a senha ou o hash.
6. **Autenticação** (feito): o login gera um JWT HS256 assinado com `JWT_SECRET` (obrigatória, pelo menos 32 bytes) e válido por `JWT_EXPIRACAO` (padrão `24h`). As rotas de `/api/usuarios/me` exigem `Authorization: Bearer <token>` e usam o id do token, então cada usuário só lê e altera os próprios dados. Não há renovação de token nem logout no servidor: o front descarta o token.

---

## 2. Contrato da API

Base: `http://localhost:8080/api` em desenvolvimento.

| Método | Rota | Uso no front hoje | Resposta |
|---|---|---|---|
| GET | `/api/health` | teste de conexão | `200 {"status":"ok"}` |
| POST | `/api/auth/register` | cadastro (`fazerCadastro` em `App.jsx`, chamado por `auth/Login.jsx`) | `201` usuário criado; `409` se o e-mail já existe; `400` se inválido; `429` por excesso de tentativas |
| POST | `/api/auth/login` | `fazerLogin` em `App.jsx` (também logo após o cadastro) | `200` token + usuário; `401` se inválido; `429` por excesso de tentativas |
| GET | `/api/usuarios/me` | restaurar a sessão ao abrir o app; dados do perfil (`src/perfil.js`) | `200` usuário (sem senha); `401` sem token |
| GET | `/api/usuarios/me/configuracoes` | carregar tema e configurações ao logar | `200` configurações |
| PUT | `/api/usuarios/me/configuracoes` | salvar alterações em `Configs.jsx` | `200` configurações salvas; `400` se faltar campo |
| PUT | `/api/usuarios/me` | editar perfil e foto (`Profile.jsx`, `Configs.jsx` → `atualizarUsuario` em `App.jsx`), sempre com o perfil completo | `200` usuário |
| PUT | `/api/usuarios/me/senha` | "Alterar senha" em `Configs.jsx` | `204`; `400` com `campos.senhaAtual` se a senha atual estiver errada |
| DELETE | `/api/usuarios/me` | "Excluir conta" em `Configs.jsx` (corpo `{senha}`), depois sai da sessão | `204`; `400` senha errada |
| GET | `/api/cursos`, `/api/areas` | select de curso (perfil e configurações); filtros de área (início e oportunidades) | `200 [{id, nome}]` (públicas) |
| GET | `/api/oportunidades` | início (destaques e contagem de abertas) e `Opportunities.jsx`; filtro e busca no front | `200` lista, mais novas primeiro |
| POST/PUT/DELETE | `/api/oportunidades` | `Opportunities.jsx`: publicar, editar e excluir (só o autor) | `201`/`200`/`204`; `403` de outro autor |
| POST/DELETE | `/api/oportunidades/{id}/participacao` | botão "Participar" | `204`; `400` na própria; `409` fechada ou repetida |
| PUT/DELETE | `/api/oportunidades/{id}/salvo` | coração de salvar e remoção em `Saved.jsx` | `204` |
| GET | `/api/usuarios/me/salvos`, `/api/usuarios/me/participacoes` | `Saved.jsx`; contagem de projetos no início e no perfil | `200` lista |
| GET/POST/PUT/DELETE | `/api/habilidades-publicadas` | `Skills.jsx` (publicar), `Publications.jsx` (editar/excluir, `?usuarioId=` do usuário), números do início | `200`/`201`/`204`; perfis privados só aparecem para o próprio autor |
| GET | `/api/pessoas` | `PeopleSkills.jsx` e aba "Encontrar pessoas" de `Connections.jsx` | `200` perfis públicos (sem o usuário) |
| GET | `/api/conexoes`, `/recebidas`, `/enviadas` | estado de cada pessoa (`useConexoes.js`): conectado, pedido enviado ou recebido | `200` lista |
| POST | `/api/conexoes`, `/{id}/aceitar`, `/{id}/recusar`; DELETE `/{id}` | conectar, aceitar, recusar, desconectar ou cancelar pedido | `201`/`200`/`204` |
| GET/POST | `/api/conversas` | lista de `Messages.jsx`; botão "Mensagem" no perfil de uma pessoa abre (ou cria) a conversa | `200`; `403` se a pessoa não aceita mensagens |
| GET/POST | `/api/conversas/{id}/mensagens` | conversa aberta (recarregada a cada 5 s) e envio | `200`/`201` |

Todas as rotas acima já existem. A proposta anterior usava `/api/users/{id}`; a API usa `/api/usuarios/me`, com o id tirado do token.

Erros seguem um formato único:

```json
{ "status": 400, "erro": "Dados inválidos", "campos": { "email": "must be a well-formed email address" } }
```

### Exemplos

`POST /api/auth/register`

```json
// requisição
{ "nome": "Maria Silva", "email": "maria@faesa.br", "senha": "segredo123" }

// resposta 201 (sem token: o front chama /api/auth/login em seguida)
{ "id": 1, "nome": "Maria Silva", "email": "maria@faesa.br", "curso": null, "periodo": null,
  "cidade": null, "bio": null, "fotoUrl": null, "criadoEm": "2026-10-06T13:10:12.772907Z" }
```

> O login é pelo e-mail (tabela `usuarios` não tem campo `usuario`), igual ao que o formulário de cadastro já envia: `nome`, `email` e `senha`. O e-mail é gravado em minúsculo (`Usuario.normalizarEmail`).

`POST /api/auth/login`

```json
// requisição
{ "email": "maria@faesa.br", "senha": "segredo123" }

// resposta 200
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "usuario": { "id": 1, "nome": "Maria Silva", "email": "maria@faesa.br", "curso": null, ... }
}
```

`GET /api/usuarios/me/configuracoes` e `PUT /api/usuarios/me/configuracoes` (mesmo corpo; no `PUT` todos os campos são obrigatórios e `tema` é `light` ou `dark`). Os campos espelham `CONFIG_PADRAO` de `App.jsx` e a tabela `configuracoes_usuario` (entidade `ConfiguracaoUsuario`):

```json
{
  "tema": "dark",
  "perfilPublico": true,
  "mostrarEmail": false,
  "permitirMensagens": true,
  "novasOportunidades": true,
  "mensagens": true,
  "conexoes": true,
  "publicacoes": true,
  "resumoSemanal": false,
  "reduzirAnimacoes": false
}
```

---

## 3. Integração com o front

### O que já está integrado

Todas as telas usam a API; não há mais dados de demonstração no front.

- **Login** (`App.jsx` → `fazerLogin`): campo "E-mail" (`type="email"`) e corpo `{email, senha}`. O token fica no `localStorage` (`marketfaesa-token`); `401` mostra "E-mail ou senha inválidos." e falha de rede mostra a mensagem do client. O botão fica desabilitado enquanto envia.
- **Cadastro** (`fazerCadastro`): senha de 8 a 72 caracteres validada no front, como na API; erros de `campos` aparecem embaixo de cada campo; `409` mostra "Este e-mail já está cadastrado."; depois do cadastro o front faz o login automaticamente.
- **Sessão**: ao abrir o app com token salvo, `GET /api/usuarios/me` restaura o usuário (tela "Carregando sua sessão...") e volta para a última página aberta. Um `401` em qualquer requisição autenticada volta para o login com o aviso de sessão expirada (`definirOnNaoAutenticado`). O "Sair" descarta o token.
- **Perfil** (`Profile.jsx`, aba Conta de `Configs.jsx`): edição de nome, curso (select de `/api/cursos`, envia `cursoId`), período (1 a 20, inteiro), cidade, bio e foto (data URL de até 1 MB) com `PUT /api/usuarios/me`; `src/perfil.js` monta o corpo completo a partir do perfil atual. Números de conexões, oportunidades e habilidades vêm das listas da API.
- **Senha e conta**: troca de senha e exclusão de conta (com confirmação da senha) em `Configs.jsx`; o botão de excluir do perfil leva para lá.
- **Configurações e tema**: carregados com `GET /api/usuarios/me/configuracoes` após o login e salvos com `PUT` (objeto completo) a cada alteração; se o `PUT` falhar, a tela recarrega o que está salvo e mostra o erro. Antes do login o tema é sempre o claro.
- **Oportunidades** (início, `Opportunities.jsx`, `Saved.jsx`): lista, participar/sair e salvar/remover pela API; a busca e o filtro por área rodam no front sobre a lista. As encerradas não mostram "Participar". "+ Publicar oportunidade" abre o formulário (tipo, título, modalidade, descrição e áreas); na própria oportunidade, o card troca "Participar" por "Editar" (que também muda o status) e "Excluir", com confirmação.
- **Habilidades publicadas** (`Skills.jsx`, `Publications.jsx`): criar, editar e excluir; os selects enviam os códigos (`INTERMEDIARIO`, `PROJETOS_FREELAS`...) e as telas mostram os rótulos (`src/rotulos.js`).
- **Pessoas e conexões** (`PeopleSkills.jsx`, `Connections.jsx`): diretório de `/api/pessoas` e todas as ações de conexão; o card de uma conexão completa cidade e habilidades com os dados do diretório.
- **Mensagens** (`Messages.jsx`): conversas e mensagens reais. Sem tempo real: com uma conversa aberta, mensagens e lista são recarregadas a cada 5 s (o intervalo para ao sair da tela).
- **Início** (`Body.jsx`): números (estudantes, oportunidades abertas, habilidades), destaques e "Categorias com mais habilidades" calculados a partir das listas da API.
- **Limpeza**: na primeira carga o front apaga as chaves do modo demonstrativo (`marketfaesa-users` com senhas em texto puro, `marketfaesa-auth`, salvos, participações, habilidades, conexões, mensagens, configurações, perfil e foto locais, além das opções removidas de duas etapas e preferências de conteúdo; ver `limparDadosAntigos` em `src/storage.js`).

### O que ainda fica no navegador (ou falta)

- **No `localStorage`, por conta**: a página aberta e o registro de que a animação de perfil completo já foi exibida.
- **Notificações**: não há rota nem tela de notificações. Na configuração, `novasOportunidades`, `mensagens`, `conexoes`, `publicacoes` e `resumoSemanal`, além de `reduzirAnimacoes`, seguem na API sem uso: o front só os devolve no PUT, que exige todos.
- **Fotos nas listas**: a API não manda `fotoUrl` nas listas, então os cards usam as iniciais do nome; o ícone da oportunidade vem do tipo.

### Cliente de API

Fica em `MarketPlace/src/api/`:

- `client.js`: `requisicao(caminho, {method, body, signal})` monta a URL a partir de `VITE_API_URL`, envia JSON e o `Authorization: Bearer` quando há token (`localStorage`, chave `marketfaesa-token`). Erros viram `ApiError` com `status`, `mensagem` (o `erro` da API) e `campos`; falha de rede vira `status: 0` com mensagem amigável. Um `401` em requisição com token limpa o token e chama o callback registrado em `definirOnNaoAutenticado(fn)`.
- `auth.js`: `cadastrar({nome, email, senha})`, `login({email, senha})` (salva o token) e `sair()`.
- `usuarios.js`: `obterMe()`, `atualizarMe(perfil)`, `alterarSenha({senhaAtual, novaSenha})`, `excluirConta(senha)`, `obterConfiguracoes()` e `salvarConfiguracoes(config)`.
- `catalogos.js`, `oportunidades.js`, `habilidades.js`, `pessoas.js`, `conexoes.js` e `conversas.js`: uma função por rota, todas sobre `requisicao` (filtros de lista viram query string com `comFiltros`).
- Nas telas, `src/useCarregar.js` carrega uma lista ao montar (com `carregando`, `erro` e `recarregar`) e `mensagemDoErro` traduz o `ApiError`.

- **Variável de ambiente**: `VITE_API_URL` (padrão `http://localhost:8080`, sem `/api`; veja `MarketPlace/.env.example`). Falta configurar a URL de produção no build (variável `VITE_API_URL` do repositório, lida pelo workflow de deploy). Sem ela, a demo do GitHub Pages não funciona: o front não tem mais modo demonstrativo e depende de um backend hospedado.
- **CORS**: o backend já libera `http://localhost:5173` e `http://127.0.0.1:5173` (Vite), `http://localhost:4173` (vite preview) e `https://arthurnunesdev.github.io`; outras origens entram por `CORS_ALLOWED_ORIGINS` (separadas por vírgula).

---

## 4. Deploy

O GitHub Pages serve apenas arquivos estáticos: o frontend continua lá, mas o backend precisa de outra hospedagem (ex.: Render, Railway, Fly.io ou uma VM), ainda não escolhida. Pontos de atenção:

- Imagem: `backend/Dockerfile`, com contexto de build `backend/`. A aplicação escuta na porta de `PORT` (padrão `8080`) e o health check é `GET /api/health`.

- Banco PostgreSQL gerenciado: o Neon já é usado; na hospedagem, basta definir as variáveis `DATABASE_*` (o pool da aplicação está limitado a 5 conexões, pensando no plano gratuito). `DATABASE_URL` precisa estar no formato `jdbc:postgresql://...?sslmode=require`: uma URL `postgresql://usuario:senha@...` injetada pelo host não funciona.
- Segredos em variáveis de ambiente, nunca no repositório: `DATABASE_*` e `JWT_SECRET` (gere um próprio para produção com `openssl rand -base64 48`; trocar o valor invalida todos os tokens emitidos). Se o front tiver outra origem, defina `CORS_ALLOWED_ORIGINS`.
- Front e back em domínios diferentes: configurar CORS e usar HTTPS nos dois.
- Limite de tentativas: atrás do proxy do host, defina `SERVER_FORWARD_HEADERS_STRATEGY=native`; sem isso, todos os clientes parecem ter o IP do proxy e o limite vira global. Se o proxy não estiver numa faixa privada, ou houver uma CDN na frente, informe os IPs em `SERVER_TOMCAT_REMOTEIP_INTERNAL_PROXIES` ou `SERVER_TOMCAT_REMOTEIP_TRUSTED_PROXIES`. Para conferir, exceda o limite em uma rede e veja se outra rede continua liberada. Os contadores ficam em memória: com mais de uma instância, será preciso movê-los para um armazenamento compartilhado.
- Planos gratuitos costumam "dormir"; a primeira requisição pode demorar, então o front deve mostrar carregamento.

---

## 5. Checklist

### Fase 1 — Base do backend
- [x] Criar `pom.xml` com Maven Wrapper e migrar para Spring Boot
- [x] Endpoint `GET /api/health` (primeiro controller, com teste)
- [x] Adicionar Spring Data JPA + Flyway e configurar o PostgreSQL no Neon (testes com Postgres embutido)
- [x] Liberar CORS para `http://localhost:5173`
- [x] Rodar `./mvnw test` no GitHub Actions em cada PR (`.github/workflows/backend.yml`)

### Fase 2 — Usuários e autenticação
- [x] Entidades `Usuario` e `ConfiguracaoUsuario` + repositories (com teste)
- [x] Service e controller de usuário
- [x] `POST /api/auth/register` com validação (`spring-boot-starter-validation`) e hash BCrypt
- [x] `POST /api/auth/login` retornando JWT
- [x] `GET /api/usuarios/me` protegido por token
- [x] Testes de integração do cadastro e login
- [x] `PUT /api/usuarios/me` (editar perfil) e catálogos (`/api/cursos` etc.)

### Fase 3 — Integração do front
- [x] Remover a divisão incompleta do Login.jsx (`auth/components`, `auth/hooks`, `auth/utils`)
- [x] Criar `src/api/client.js` e a variável `VITE_API_URL`
- [x] Incluir a origem da API no `connect-src` da CSP (`vite.config.js`)
- [x] Login com `{email, senha}` e campo "E-mail"; senha mínima 8 no cadastro; login logo após o cadastro
- [x] Trocar o login simulado de dev pela API
- [x] Ligar o cadastro (`onRegister`) à API
- [x] Estados de carregamento e erro no login e cadastro
- [x] Logout (botão "Sair" já existe no cabeçalho) limpando o token; `401` redireciona para o login
- [x] Restaurar a sessão com `GET /api/usuarios/me` e apagar as contas locais antigas
- [x] Enviar as edições do perfil para `PUT /api/usuarios/me` e remover `marketfaesa-perfil:<id>`
- [x] Troca de senha e exclusão de conta
- [x] Oportunidades, salvos, habilidades publicadas, pessoas, conexões e mensagens pela API (sem `localStorage`)
- [x] Tela para publicar e editar oportunidades (`POST/PUT/DELETE /api/oportunidades`)

### Fase 4 — Configurações
- [x] `GET/PUT /api/usuarios/me/configuracoes`
- [x] Carregar configurações após o login e salvar ao alterar em `Configs.jsx`
- [x] Tema só da API (sem cópia no `localStorage`)

### Fase 5 — Produção
- [x] Usar PostgreSQL (Neon)
- [x] Criar o `backend/Dockerfile` e ler a porta de `PORT`
- [ ] Hospedar o backend e configurar variáveis de ambiente (`DATABASE_*`, `JWT_SECRET`, `CORS_ALLOWED_ORIGINS`, `SERVER_FORWARD_HEADERS_STRATEGY`)
- [ ] Definir `VITE_API_URL` de produção no workflow de deploy
- [x] Liberar CORS para a origem do GitHub Pages

### Opcional — Limpeza do frontend
- [x] Renomear o `name` do `package.json` para `marketfaesa`
- [x] Remover o Tailwind CSS, que estava instalado mas não era usado
- [x] Definir o favicon em `index.html` (`marketfaesa-symbol.svg`)
- [x] Remover os SVGs não usados de `public/` (`Imagens/Conta.svg`, `Imagens/Menu.svg`, `icons.svg`, `favicon.svg`)

---

## Referência: rodar o backend

Dentro de `backend/` (JDK 21+):

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=local   # http://localhost:8080 (com backend/application-local.properties)
./mvnw test                                               # Postgres embutido ou TEST_DATABASE_URL
```

No PowerShell ou no CMD, use `.\mvnw.cmd`. Mais detalhes no [README](README.md#como-rodar-o-backend).
