<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="MarketPlace/public/marketfaesa-symbol-dark.svg">
    <img src="MarketPlace/public/marketfaesa-symbol.svg" alt="Símbolo do MarketFaesa" width="96">
  </picture>
</p>

<h1 align="center">MarketFaesa 💻</h1>

<p align="center">
  <img src="https://img.shields.io/badge/react-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19">
  <img src="https://img.shields.io/badge/vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite 8">
  <img src="https://img.shields.io/badge/javascript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/css-663399?style=for-the-badge&logo=css&logoColor=white" alt="CSS">
  <img src="https://img.shields.io/badge/java-21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white" alt="Java 21">
  <img src="https://img.shields.io/badge/spring_boot-4.1-6DB33F?style=for-the-badge&logo=springboot&logoColor=white" alt="Spring Boot 4.1">
  <img src="https://img.shields.io/badge/spring_security-6DB33F?style=for-the-badge&logo=springsecurity&logoColor=white" alt="Spring Security">
  <img src="https://img.shields.io/badge/postgresql-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL 16">
  <img src="https://img.shields.io/badge/flyway-CC0200?style=for-the-badge&logo=flyway&logoColor=white" alt="Flyway">
  <img src="https://img.shields.io/badge/maven-C71A36?style=for-the-badge&logo=apachemaven&logoColor=white" alt="Maven">
  <img src="https://img.shields.io/badge/vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white" alt="Vitest">
  <img src="https://img.shields.io/badge/github_pages-222222?style=for-the-badge&logo=githubpages&logoColor=white" alt="GitHub Pages">
</p>

<p align="center">
  <b>Marketplace universitário da FAESA: um lugar para estudantes de cursos diferentes divulgarem habilidades, encontrarem oportunidades e se conectarem.</b>
</p>

<p align="center">
  🌐 <a href="https://arthurnunesdev.github.io/Projeto-Integrador-Computacional/">Acessar o site</a>
</p>

**Sumário**

- [📌 Situação atual](#situacao)
- [✨ Funcionalidades](#funcionalidades)
- [🚀 Como começar](#comecar)
  - [Pré-requisitos](#pre-requisitos)
  - [Clonando](#clonando)
  - [Variáveis de ambiente](#variaveis)
  - [Executando](#executando)
  - [Banco de dados](#banco)
  - [Testes](#testes)
- [📍 API](#api)
- [🗂️ Estrutura](#estrutura)
- [🎨 Identidade visual](#identidade)
- [🌐 Deploy](#deploy)
- [🤝 Colaboradores](#colaboradores)
- [📫 Como contribuir](#contribuir)

<h2 id="situacao">📌 Situação atual</h2>

O **frontend em React** tem interface funcional e responsiva, publicada no GitHub Pages. O **backend em Java com Spring Boot** já sobe com Spring Security configurado e se conecta a um **PostgreSQL** (hospedado no [Neon](https://neon.tech)): o schema é criado por migrations do Flyway e as entidades `Usuario` e `ConfiguracaoUsuario` já estão mapeadas, com seus repositórios. Ainda **não tem endpoints**.

Por isso, hoje o front funciona sozinho: os dados ficam no `localStorage` e o login é simulado, disponível só em desenvolvimento.

> [!IMPORTANT]
> O login local serve apenas para desenvolvimento e testes. A versão final usará autenticação pelo backend, com senha armazenada em hash e nunca em texto puro no navegador.

<h2 id="funcionalidades">✨ Funcionalidades</h2>

| Disponível no frontend | |
|---|---|
| 🔐 Login e cadastro locais para testes | 🏠 Dashboard com estatísticas e oportunidades |
| 👤 Perfil com progresso de preenchimento | 🏆 Animação de conquista ao completar o perfil |
| 🛠️ Publicação e gestão de habilidades | 👥 Busca de estudantes e conexões |
| 💬 Mensagens entre usuários | 🔖 Itens salvos |
| 📋 Minhas publicações | ⚙️ Configurações de conta e preferências |
| 🌙 Tema claro e escuro | 📱 Layout responsivo para desktop e mobile |

<h2 id="comecar">🚀 Como começar</h2>

O projeto tem duas partes independentes: o frontend em `MarketPlace/` e o backend em `backend/`. O frontend roda sozinho; o backend precisa de um banco PostgreSQL (veja [Banco de dados](#banco)).

<h3 id="pre-requisitos">Pré-requisitos</h3>

- [Git](https://git-scm.com/)
- [Node.js 20+](https://nodejs.org/) para o frontend
- [JDK 21+](https://adoptium.net/) para o backend. O Maven não precisa ser instalado: o projeto usa o Maven Wrapper.
- Um banco PostgreSQL para rodar o backend: o projeto usa o [Neon](https://neon.tech) (plano gratuito). Para os testes não é preciso nada, veja [Testes](#testes).

<h3 id="clonando">Clonando</h3>

```bash
git clone https://github.com/ArthurNunesDev/Projeto-Integrador-Computacional.git
cd Projeto-Integrador-Computacional
```

<h3 id="variaveis">Variáveis de ambiente</h3>

Use o `MarketPlace/.env.example` como referência para criar o arquivo `MarketPlace/.env.development.local` com as credenciais do login de teste:

```env
VITE_DEV_USER=seu-usuario-de-teste
VITE_DEV_PASS=sua-senha-de-teste
```

O Vite só carrega esse arquivo em `npm run dev`. Em produção o login de teste fica desativado.

<h3 id="executando">Executando</h3>

**Frontend** — abre em `http://localhost:5173`

```bash
cd MarketPlace
npm install
npm run dev
```

Para gerar a versão de produção: `npm run build`.

<a id="como-rodar-o-backend"></a>
**Backend** — sobe em `http://localhost:8080`

```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
```

No Windows (PowerShell ou CMD), use `.\mvnw.cmd` no lugar de `./mvnw` (no PowerShell, coloque `"-Dspring-boot.run.profiles=local"` entre aspas). O perfil `local` lê a conexão do arquivo `backend/application-local.properties`; veja [Banco de dados](#banco). Com as variáveis de ambiente definidas, basta `./mvnw spring-boot:run`.

<h3 id="banco">Banco de dados</h3>

O backend usa PostgreSQL hospedado no [Neon](https://neon.tech). Não há banco em memória nem Docker: tanto o desenvolvimento quanto a produção falam com um Postgres de verdade.

O schema é criado só pelas migrations do Flyway em `backend/src/main/resources/db/migration/`, aplicadas automaticamente ao subir a aplicação. O Hibernate roda com `ddl-auto=validate`: ele só confere se as entidades batem com as tabelas e nunca altera o banco. Para mudar o schema, crie uma nova migration (`V<n>__descricao.sql`); nunca edite uma que já foi aplicada.

A conexão vem de variáveis de ambiente, lidas em `application.properties`:

| Variável | Uso |
|---|---|
| `DATABASE_URL` | URL JDBC do Neon **com pooler** (host com `-pooler`), usada pela aplicação |
| `DATABASE_USERNAME` | usuário do banco |
| `DATABASE_PASSWORD` | senha do banco |
| `DATABASE_DIRECT_URL` | opcional: URL JDBC **direta** (host sem `-pooler`), usada pelo Flyway nas migrations; se faltar, usa `DATABASE_URL` |

O Neon mostra a conexão como URI (`postgresql://usuario:senha@host/neondb?sslmode=require`). O JDBC não aceita esse formato: troque o prefixo por `jdbc:postgresql://`, tire `usuario:senha@` da URL e passe usuário e senha nas variáveis separadas. Exemplo:

```env
DATABASE_URL=jdbc:postgresql://ep-xxxx-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require
```

Em vez de exportar as variáveis, você pode usar o perfil `local`: copie `backend/application-local.properties.example` para `backend/application-local.properties` (já ignorado pelo Git, nunca faça commit dele) e preencha com os dados do seu banco no Neon.

<h3 id="testes">Testes</h3>

```bash
# frontend (Vitest + Testing Library)
cd MarketPlace
npm test
npm run lint

# backend (JUnit + Spring Security Test)
cd backend
./mvnw test
```

Os testes do backend não usam o Neon. A classe `backend/src/test/java/br/com/marketfaesa/PostgresDeTeste.java` fornece o banco:

- se a variável `TEST_DATABASE_URL` existir (com `TEST_DATABASE_USERNAME` e `TEST_DATABASE_PASSWORD` opcionais), usa esse banco;
- senão, sobe um PostgreSQL 16 embutido ([zonky embedded-postgres](https://github.com/zonkyio/embedded-postgres)), baixado como dependência do Maven, sem instalar nada.

O Flyway aplica as migrations nesse banco antes dos testes. Se o Postgres embutido não subir no seu ambiente (ex.: sem permissão para extrair e executar os binários em `/tmp`), ou se preferir usar um Postgres já instalado, aponte `TEST_DATABASE_URL` para ele:

```bash
TEST_DATABASE_URL=jdbc:postgresql://localhost:5432/mf_test TEST_DATABASE_USERNAME=mf TEST_DATABASE_PASSWORD=mf ./mvnw test
```

Como escrever testes que usam o banco:

- **`@SpringBootTest`**: não precisa fazer nada. `PostgresDeTeste` é um `@Configuration` no pacote `br.com.marketfaesa`, então o component scan o encontra e o `DataSource` dele (marcado com `@Primary` e `@FlywayDataSource`) substitui o do `application.properties`.
- **Testes de fatia** (ex.: `@DataJpaTest`, que não fazem component scan): adicione `@Import(PostgresDeTeste.class)` e `@AutoConfigureTestDatabase(replace = Replace.NONE)`.

<h2 id="api">📍 API</h2>

> [!NOTE]
> **Nenhum endpoint está implementado ainda.** A tabela abaixo é o contrato **planejado**, descrito em detalhe no [PROXIMOS_PASSOS.md](PROXIMOS_PASSOS.md#2-contrato-de-api-proposto).

Base em desenvolvimento: `http://localhost:8080/api`

| Rota | Descrição | Status |
|---|---|---|
| `GET /api/health` | Teste de conexão com o backend | Planejado |
| `POST /api/auth/register` | Cadastro de usuário | Planejado |
| `POST /api/auth/login` | Login, retorna token JWT | Planejado |
| `GET /api/users/{id}` | Dados do perfil, sem senha | Planejado |
| `GET /api/users/{id}/config` | Carrega tema e preferências | Planejado |
| `PUT /api/users/{id}/config` | Salva tema e preferências | Planejado |

O que já está configurado no backend: API stateless em que toda rota exige autenticação e responde `401` sem token, CORS liberado para `http://localhost:5173` e para o GitHub Pages, e BCrypt para hash de senhas.

<h2 id="estrutura">🗂️ Estrutura</h2>

```text
Projeto-Integrador-Computacional/
├── .github/
│   ├── workflows/deploy.yml        # build e publicação no GitHub Pages
│   └── pull_request_template.md
├── MarketPlace/                    # frontend React + Vite
│   ├── public/                     # símbolo, favicon e imagens
│   └── src/
│       ├── auth/                   # tela de login e cadastro
│       ├── components/             # telas e componentes
│       ├── App.jsx
│       └── index.css
├── backend/                        # API Java + Spring Boot
│   ├── application-local.properties.example  # modelo da config local do banco
│   └── src/
│       ├── main/java/br/com/marketfaesa/
│       │   ├── config/             # SecurityConfig
│       │   ├── controller/
│       │   ├── model/              # entidades JPA: Usuario, ConfiguracaoUsuario, Tema
│       │   ├── repository/         # UsuarioRepository, ConfiguracaoUsuarioRepository
│       │   └── service/
│       ├── main/resources/db/migration/  # migrations do Flyway (V1__..., V2__...)
│       └── test/java/br/com/marketfaesa/ # testes; PostgresDeTeste fornece o banco
├── CONTRIBUTING.md
├── PROXIMOS_PASSOS.md
└── README.md
```

<h2 id="identidade">🎨 Identidade visual</h2>

| Cor | Hex | Uso |
|---|---|---|
| Azul-marinho | `#1E2761` | Cor principal, textos e fundos escuros |
| Azul-claro | `#CADCFC` | Superfícies e símbolo no tema escuro |
| Laranja | `#D98324` | Destaque: o card "publicado" do símbolo |

O símbolo representa um mural com quatro cards, um deles sendo fixado. Os arquivos estão em `MarketPlace/public/` nas versões clara e escura.

<h2 id="deploy">🌐 Deploy</h2>

O frontend é publicado automaticamente no **GitHub Pages** pelo GitHub Actions a cada push na `main`.

O GitHub Pages serve apenas arquivos estáticos, então o backend precisará de outra hospedagem quando estiver pronto. Os detalhes estão no [PROXIMOS_PASSOS.md](PROXIMOS_PASSOS.md#4-deploy).

<h2 id="colaboradores">🤝 Colaboradores</h2>

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/ArthurNunesDev">
        <img src="https://github.com/ArthurNunesDev.png" width="100" alt="Foto de Arthur Nunes"><br>
        <sub><b>Arthur Nunes Berti Xavier</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/igorhsalgado">
        <img src="https://github.com/igorhsalgado.png" width="100" alt="Foto de Igor Salgado"><br>
        <sub><b>Igor Hermann Salgado</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/EnzoCoutinh0">
        <img src="https://github.com/EnzoCoutinh0.png" width="100" alt="Foto de Enzo Ceglias Coutinho"><br>
        <sub><b>Enzo Ceglias Coutinho</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/lucaszbrz">
        <img src="https://github.com/lucaszbrz.png" width="100" alt="Foto de Lucas de Souza Barboza"><br>
        <sub><b>Lucas de Souza Barboza</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/DSTIEG">
        <img src="https://github.com/DSTIEG.png" width="100" alt="Foto de Daniel Stieg Radaelle"><br>
        <sub><b>Daniel Stieg Radaelle</b></sub>
      </a>
    </td>
  </tr>
</table>

<h2 id="contribuir">📫 Como contribuir</h2>

O fluxo completo, com padrão de nomes e exemplos, está no [CONTRIBUTING.md](CONTRIBUTING.md). Em resumo:

1. Faça um fork e crie a branch a partir da `main` atualizada do repositório principal, com nome em minúsculas começando pelo verbo: `corrige-erro-login`.
2. Escreva os commits em português, no imperativo na 3ª pessoa: `Corrige erro no login`.
3. Rode as verificações: `npm run build` e `npm run lint` no frontend, `./mvnw test` no backend.
4. Abra o PR para a `main` preenchendo o [template](.github/pull_request_template.md). Outra pessoa do time revisa e faz o merge.

Se a mudança altera o que este README ou o `PROXIMOS_PASSOS.md` descrevem, atualize-os no mesmo PR.

---

<p align="center">Desenvolvido para o <b>Projeto Integrador Computacional</b> da FAESA.</p>
