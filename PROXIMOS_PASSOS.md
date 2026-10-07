# Próximos passos

Roadmap para evoluir o backend e ligá-lo ao frontend. Hoje o front funciona sozinho: login simulado só em dev (credenciais de `.env.development.local`, desativado em produção), cadastro sem persistência e todas as preferências no `localStorage`. O backend já roda com Spring Boot 4.1 (Java 21+, Maven Wrapper), já conecta ao PostgreSQL (Neon) com migrations do Flyway e já tem os endpoints de health, cadastro, login (JWT), perfil e configurações (lista no [README](README.md#api)). Falta o front chamá-los.

---

## 1. Evoluir o backend

1. **Ferramenta de build** (feito): Maven com Maven Wrapper (`backend/mvnw`), então ninguém precisa instalar o Maven. As dependências ficam em `backend/pom.xml`.
2. **Framework** (base feita): Spring Boot 4.1 com Spring Web MVC, que já resolve servidor HTTP, JSON, injeção de dependência e CORS, e Spring Security em `config/SecurityConfig.java` (API stateless: `/api/health`, `/api/auth/register` e `/api/auth/login` são públicas, o resto exige `Bearer` e responde `401` no formato de erro; CORS configurável por `CORS_ALLOWED_ORIGINS`, com padrão `http://localhost:5173` e o GitHub Pages; BCrypt para senhas). Starters:
   - `spring-boot-starter-data-jpa`, Flyway e o driver do PostgreSQL já estão no `pom.xml` (banco no Neon, ver item 4);
   - `spring-boot-starter-validation`, usado com `@Valid` nos DTOs de `dto/`;
   - `spring-boot-starter-security-oauth2-resource-server`, que valida o JWT (HS256, `config/JwtConfig.java`).
3. **Camadas** (as pastas já existem em `backend/src/main/java/br/com/marketfaesa/`):
   - `model`: entidades (`Usuario`, `ConfiguracaoUsuario`).
   - `repository`: acesso ao banco (interfaces `JpaRepository`).
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
| POST | `/api/auth/register` | formulário de cadastro (`auth/Login.jsx` → `onRegister`) | `201` usuário criado; `409` se o e-mail já existe; `400` se inválido |
| POST | `/api/auth/login` | `fazerLogin` em `App.jsx` (hoje login de teste só em dev) | `200` token + usuário; `401` se inválido |
| GET | `/api/usuarios/me` | perfil (`Profile.jsx`) | `200` usuário (sem senha); `401` sem token |
| GET | `/api/usuarios/me/configuracoes` | carregar tema e configurações ao logar | `200` configurações |
| PUT | `/api/usuarios/me/configuracoes` | salvar alterações em `Configs.jsx` | `200` configurações salvas; `400` se faltar campo |

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

### O que o front ainda precisa mudar para falar com a API

- **Senha mínima de 8 caracteres**: o cadastro valida 6 (`Login.jsx`); a API recusa menos de 8 com `400`.
- **Login depois do cadastro**: `POST /api/auth/register` devolve `201` com o usuário, sem token. O front chama `POST /api/auth/login` logo em seguida (ou leva o usuário para a tela de login).
- **Corpo do login `{email, senha}`**: o formulário mostra o campo "Usuário / E-mail" e envia `{usuario, email, senha}` com o mesmo valor; a API só aceita e-mail, então o campo passa a ser "E-mail" com `type="email"` e o corpo fica `{email, senha}`.
- **Bearer**: guardar o token do login e mandar `Authorization: Bearer <token>` nas rotas de `/api/usuarios/me`. Um `401` limpa a sessão e volta para o login.
- **CSP**: `connect-src 'self'` em `vite.config.js` bloqueia o `fetch` para a API em outro domínio. A diretiva precisa incluir a origem de `VITE_API_URL`.
- **Erros**: ler `erro` e `campos` do corpo (`{status, erro, campos}`) no lugar do `{sucesso, mensagem}` do cadastro local.

### Chaves do `localStorage` → API

Toda a leitura e escrita dessas chaves está em `MarketPlace/src/App.jsx`.

| Chave atual | Substituir por | Onde mudar |
|---|---|---|
| `marketfaesa-auth` | `POST /api/auth/login`; guardar só o token + dados básicos do usuário | `App.jsx` (`fazerLogin`, `fazerLogout`, `obterUsuarioInicial`) |
| *(cadastro não persiste)* | `POST /api/auth/register` | `App.jsx` (passar `onRegister` para `<Login>`) e `auth/Login.jsx` (que já aceita `onRegister`) |
| `marketfaesa-theme` | campo `tema` de `GET/PUT /api/usuarios/me/configuracoes` | `App.jsx` (`obterTemaInicial`, `useEffect` do tema) |
| `marketfaesa-config` | `GET/PUT /api/usuarios/me/configuracoes` | `App.jsx` (`obterConfiguracoesIniciais`, `useEffect` de configurações), `components/Configs.jsx` |

Sugestão: manter o `localStorage` como cache do tema, para ele não "piscar" ao carregar (antes de logar ainda não existe usuário para buscar a config).

### Cliente de API

Criar um único módulo, por exemplo `MarketPlace/src/api/client.js`, usando `fetch`:

```js
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080/api";

export async function api(caminho, { method = "GET", body } = {}) {
  const token = localStorage.getItem("marketfaesa-token");
  const resposta = await fetch(`${API_URL}${caminho}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body && JSON.stringify(body),
  });
  const dados = resposta.status === 204 ? null : await resposta.json();
  if (!resposta.ok) throw Object.assign(new Error(dados?.erro ?? "Erro na requisição"), { status: resposta.status, dados });
  return dados;
}
```

- **Variável de ambiente**: criar `MarketPlace/.env.development` com `VITE_API_URL=http://localhost:8080/api` e configurar a URL de produção no build (secret/variável no workflow de deploy).
- **CORS**: o backend já libera `http://localhost:5173` (Vite) e `https://arthurnunesdev.github.io`; outras origens entram por `CORS_ALLOWED_ORIGINS` (separadas por vírgula).
- **Token**: salvar o JWT após o login, enviar em todas as requisições e, ao receber `401`, limpar a sessão e voltar para o login.
- **Estados de tela**: mostrar carregamento (desabilitar o botão de "Entrar"/"Salvar"), exibir a mensagem de erro da API nos campos já existentes (`erro`, `erroCadastro`) e tratar falha de rede ("Servidor indisponível").

---

## 4. Deploy

O GitHub Pages serve apenas arquivos estáticos: o frontend continua lá, mas o backend precisa de outra hospedagem (ex.: Render, Railway, Fly.io ou uma VM). Pontos de atenção:

- Banco PostgreSQL gerenciado: o Neon já é usado; na hospedagem, basta definir as variáveis `DATABASE_*` (o pool da aplicação está limitado a 5 conexões, pensando no plano gratuito).
- Segredos em variáveis de ambiente, nunca no repositório: `DATABASE_*` e `JWT_SECRET` (gere um próprio para produção com `openssl rand -base64 48`; trocar o valor invalida todos os tokens emitidos). Se o front tiver outra origem, defina `CORS_ALLOWED_ORIGINS`.
- Front e back em domínios diferentes: configurar CORS e usar HTTPS nos dois.
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
- [ ] `PUT /api/usuarios/me` (editar perfil) e catálogos (`/api/cursos` etc.)

### Fase 3 — Integração do front
- [x] Remover a divisão incompleta do Login.jsx (`auth/components`, `auth/hooks`, `auth/utils`)
- [ ] Criar `src/api/client.js` e `.env.development` com `VITE_API_URL`
- [ ] Incluir a origem da API no `connect-src` da CSP (`vite.config.js`)
- [ ] Login com `{email, senha}` e campo "E-mail"; senha mínima 8 no cadastro; login logo após o cadastro
- [ ] Trocar o login simulado de dev pela API
- [ ] Ligar o cadastro (`onRegister`) à API
- [ ] Estados de carregamento e erro no login e cadastro
- [ ] Logout (botão "Sair" já existe no cabeçalho) limpando o token; `401` redireciona para o login

### Fase 4 — Configurações
- [x] `GET/PUT /api/usuarios/me/configuracoes`
- [ ] Carregar configurações após o login e salvar ao alterar em `Configs.jsx`
- [ ] Manter `localStorage` só como cache do tema

### Fase 5 — Produção
- [x] Usar PostgreSQL (Neon)
- [ ] Hospedar o backend e configurar variáveis de ambiente (`DATABASE_*`, `JWT_SECRET`, `CORS_ALLOWED_ORIGINS`)
- [ ] Definir `VITE_API_URL` de produção no workflow de deploy
- [x] Liberar CORS para a origem do GitHub Pages

### Opcional — Limpeza do frontend
- [ ] Renomear o `name` do `package.json` (ainda `meu-projeto-react`)
- [ ] Configurar o Tailwind CSS (instalado, mas não configurado) ou removê-lo
- [ ] Definir o favicon em `index.html` (hoje vazio)
- [ ] Remover os SVGs não usados de `public/Imagens/` (`Conta.svg`, `Menu.svg`, `icons.svg`)

---

## Referência: rodar o backend

Dentro de `backend/` (JDK 21+):

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=local   # http://localhost:8080 (com backend/application-local.properties)
./mvnw test                                               # Postgres embutido ou TEST_DATABASE_URL
```

No PowerShell ou no CMD, use `.\mvnw.cmd`. Mais detalhes no [README](README.md#como-rodar-o-backend).
