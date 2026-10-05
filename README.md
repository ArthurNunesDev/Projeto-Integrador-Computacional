# MarketFaesa

[MarketFaesa](https://arthurnunesdev.github.io/Projeto-Integrador-Computacional/) é um marketplace universitário desenvolvido no Projeto Integrador Computacional da FAESA.

A proposta do projeto é conectar estudantes de diferentes cursos para encontrar **freelas, monitorias, aulas, projetos, consultorias e outras oportunidades**, permitindo também divulgar habilidades e criar conexões.

O projeto está em desenvolvimento: o **frontend já possui uma interface funcional em React**, enquanto o **backend em Java com Spring Boot está sendo estruturado para, posteriormente, assumir a autenticação, usuários, configurações e persistência dos dados**.

---

## Estado atual do projeto

### Frontend

O frontend atualmente funciona como uma SPA (Single Page Application) em React e possui:

- Tela de login;
- Tela de cadastro;
- Login local para facilitar os testes durante o desenvolvimento;
- Cadastro local de usuários;
- Sessão persistida no navegador;
- Dashboard inicial;
- Barra de pesquisa para oportunidades;
- Menu lateral de navegação;
- Menu de perfil;
- Página de perfil;
- Página de configurações;
- Tema claro e escuro;
- Configurações de privacidade;
- Configurações de notificações;
- Opção para reduzir animações;
- Cards de oportunidades;
- Áreas de conhecimento;
- Estatísticas do marketplace;
- Habilidades mais buscadas;
- Favicon e identidade visual baseada na marca MarketFaesa;
- Responsividade e estilização própria dos componentes.

### Autenticação local — temporária

Atualmente o login e o cadastro são **locais e servem principalmente para facilitar os testes enquanto o projeto ainda está em desenvolvimento**.

O fluxo atual é:

1. O usuário cria uma conta pela tela de cadastro;
2. Os dados da conta são armazenados no <code>localStorage</code> do navegador;
3. O usuário é autenticado localmente;
4. A sessão também é mantida no <code>localStorage</code>;
5. É possível sair pelo menu do perfil;
6. Depois, o usuário pode entrar novamente usando o e-mail e a senha cadastrados.

Também existe suporte a credenciais de teste através de <code>.env.development.local</code> durante o desenvolvimento.

> **Importante:** essa autenticação é provisória. Quando o backend e a API de autenticação estiverem implementados, o login/cadastro local deverá ser **retirado e substituído pela autenticação real da aplicação**. Senhas não devem permanecer armazenadas em texto puro no navegador em uma versão de produção.

### Backend

O backend está sendo desenvolvido com:

- Java 21;
- Spring Boot 4.1;
- Spring Web MVC;
- Spring Security;
- Spring Validation;
- Maven Wrapper.

A estrutura inicial já possui a separação entre:

- <code>model</code>;
- <code>repository</code>;
- <code>service</code>;
- <code>controller</code>;
- <code>config</code>.

O backend ainda está em fase de estruturação e a integração completa com o frontend ainda não foi concluída.

---

## Tecnologias

| Camada | Tecnologias |
|---|---|
| Frontend | React 19, Vite 8, JavaScript, JSX, CSS |
| Estilização | CSS próprio + Tailwind CSS 4 instalado |
| Testes | Vitest, Testing Library, JSDOM |
| Backend | Java 21, Spring Boot 4.1, Spring Web MVC |
| Segurança | Spring Security |
| Validação | Spring Validation |
| Build backend | Maven Wrapper |
| Deploy frontend | GitHub Actions + GitHub Pages |
| Persistência atual do frontend | localStorage |

---

## Estrutura do projeto

~~~
Projeto-Integrador-Computacional/
├── .github/
│   └── workflows/
│       └── deploy.yml
│
├── MarketPlace/
│   ├── public/
│   │   ├── Imagens/
│   │   └── marketfaesa-symbol.svg
│   │
│   ├── src/
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   └── Login.css
│   │   │
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── Header.css
│   │   │   ├── Body.jsx
│   │   │   ├── Body.css
│   │   │   ├── Profile.jsx
│   │   │   ├── Profile.css
│   │   │   ├── Configs.jsx
│   │   │   └── Configs.css
│   │   │
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── .env.example
│
├── backend/
│   ├── src/
│   ├── pom.xml
│   ├── mvnw
│   ├── mvnw.cmd
│   └── .mvn/
│
├── CONTRIBUTING.md
├── PROXIMOS_PASSOS.md
└── README.md
~~~

---

## Identidade visual

A interface atual segue a identidade visual do MarketFaesa, utilizando principalmente:

- **Azul-marinho:** <code>#1E2761</code>
- **Azul-claro:** <code>#CADCFC</code>
- **Laranja:** <code>#D98324</code>

O símbolo da marca utiliza quatro módulos arredondados, com o módulo superior direito em laranja e levemente inclinado.

O mesmo símbolo é utilizado na interface e como **favicon** do site.

---

## Funcionalidades atuais

### 🔐 Login e cadastro

O sistema possui uma tela única para:

- Entrar;
- Criar conta;
- Mostrar/ocultar senha;
- Validar campos obrigatórios;
- Validar tamanho mínimo da senha;
- Confirmar senha no cadastro;
- Exibir mensagens de erro;
- Recuperação de senha como ponto de navegação preparado para evolução futura.

O cadastro e o login atuais são locais e **não representam a autenticação definitiva do sistema**.

### 🏠 Dashboard

A página inicial apresenta:

- Saudação ao usuário;
- Atalho para publicação de habilidade;
- Estatísticas de estudantes, oportunidades e habilidades;
- Filtro por áreas de conhecimento;
- Oportunidades em destaque;
- Informações de modalidade e área;
- Perfil resumido;
- Progresso de preenchimento do perfil;
- Ranking de habilidades mais buscadas.

### 🔎 Pesquisa

O cabeçalho possui uma barra de pesquisa preparada para buscar:

~~~
Buscar freelas, monitorias, aulas
~~~

A busca visual já está presente na interface; a pesquisa real sobre dados do backend será implementada posteriormente.

### 👤 Perfil

A aplicação possui uma área de perfil com informações do usuário e opções relacionadas às configurações de privacidade.

### ⚙️ Configurações

As configurações atuais incluem:

- Tema claro/escuro;
- Perfil público;
- Exibição de e-mail;
- Permissão para mensagens;
- Notificações de oportunidades;
- Notificações de mensagens;
- Notificações de conexões;
- Notificações de publicações;
- Resumo semanal;
- Redução de animações.

As preferências são atualmente armazenadas no navegador.

---

## Persistência local atual

Durante a fase de prototipação, o frontend utiliza <code>localStorage</code>.

Principais chaves utilizadas:

| Chave | Finalidade |
|---|---|
| <code>marketfaesa-auth</code> | Sessão do usuário atualmente autenticado |
| <code>marketfaesa-users</code> | Contas criadas localmente para testes |
| <code>marketfaesa-theme</code> | Tema escolhido |
| <code>marketfaesa-config</code> | Preferências de configuração |

Essa solução existe para permitir que o frontend seja testado **antes da conclusão do backend**.

### Futuramente

Esses dados deverão ser migrados para a API:

~~~
Frontend React
      ↓
API REST
      ↓
Spring Boot
      ↓
Banco de dados
~~~

A autenticação definitiva deverá utilizar o backend e mecanismos apropriados de segurança, sem armazenar senhas em texto puro no frontend.

---

## Como rodar o frontend

### 1. Instalar as dependências

Pré-requisito: **Node.js 20 ou superior**.

No terminal:

~~~bash
cd MarketPlace
npm install
~~~

### 2. Rodar em desenvolvimento

~~~bash
npm run dev
~~~

O Vite disponibilizará o projeto em um endereço local, normalmente:

~~~
http://localhost:5173/Projeto-Integrador-Computacional/
~~~

### 3. Testar o login

A forma mais simples é:

1. Abrir a aplicação;
2. Clicar em **Criar conta**;
3. Preencher nome, e-mail e senha;
4. Cadastrar;
5. A aplicação entrará automaticamente;
6. Sair pelo menu do perfil;
7. Entrar novamente usando o e-mail e a senha cadastrados.

### Credenciais de desenvolvimento opcionais

Também é possível configurar credenciais específicas para testes.

Copie:

~~~
MarketPlace/.env.example
~~~

para:

~~~
MarketPlace/.env.development.local
~~~

e preencha:

~~~env
VITE_DEV_USER=seu_usuario
VITE_DEV_PASS=sua_senha
~~~

Essas credenciais são utilizadas **somente durante o desenvolvimento**.

> O arquivo <code>.env.development.local</code> não deve ser enviado para o GitHub.

---

## Scripts do frontend

Dentro de <code>MarketPlace/</code>:

| Comando | Função |
|---|---|
| <code>npm run dev</code> | Inicia o servidor de desenvolvimento |
| <code>npm run build</code> | Gera o build de produção |
| <code>npm run preview</code> | Executa uma prévia do build |
| <code>npm run lint</code> | Executa o ESLint |
| <code>npm test</code> | Executa os testes com Vitest em modo watch |
| <code>npx vitest run</code> | Executa os testes uma vez |

---

## Como rodar o backend

Pré-requisito: **JDK 21 ou superior**.

Entre na pasta:

~~~bash
cd backend
~~~

### Linux/macOS

~~~bash
./mvnw spring-boot:run
~~~

### Windows PowerShell/CMD

~~~powershell
.\mvnw.cmd spring-boot:run
~~~

Para executar os testes:

~~~powershell
.\mvnw.cmd test
~~~

O backend utiliza o Maven Wrapper, portanto não é necessário instalar o Maven separadamente.

O servidor está preparado para trabalhar em:

~~~
http://localhost:8080
~~~

A integração completa com o frontend ainda está em desenvolvimento.

---

## Deploy

O frontend é publicado automaticamente no **GitHub Pages**.

Sempre que houver um push na branch <code>main</code>, o workflow:

1. Baixa o código;
2. Configura o Node.js;
3. Instala as dependências;
4. Executa <code>npm run build</code>;
5. Publica o conteúdo de <code>MarketPlace/dist</code>;
6. Faz o deploy no GitHub Pages.

O Vite utiliza como base:

~~~
/Projeto-Integrador-Computacional/
~~~

O backend não é hospedado pelo GitHub Pages, pois o Pages disponibiliza apenas conteúdo estático. Quando a API estiver pronta, será necessário hospedar o backend separadamente.

---

## Roadmap

### Fase 1 — Interface e protótipo

- [x] Criar estrutura inicial do frontend
- [x] Criar identidade visual do MarketFaesa
- [x] Criar dashboard
- [x] Criar navegação
- [x] Criar perfil
- [x] Criar configurações
- [x] Criar login
- [x] Criar cadastro
- [x] Implementar login/cadastro local para testes
- [x] Persistir sessão e configurações localmente
- [x] Adicionar favicon
- [x] Publicar frontend no GitHub Pages

### Fase 2 — Backend

- [x] Criar estrutura inicial do backend
- [x] Configurar Java 21
- [x] Configurar Spring Boot
- [x] Configurar Spring Security
- [x] Configurar validação
- [ ] Criar banco de dados
- [ ] Criar persistência de usuários
- [ ] Criar endpoints REST
- [ ] Implementar cadastro real
- [ ] Implementar login real
- [ ] Implementar autenticação por token
- [ ] Implementar recuperação de senha

### Fase 3 — Integração frontend + backend

- [ ] Criar cliente de API no frontend
- [ ] Ligar cadastro à API
- [ ] Ligar login à API
- [ ] Migrar sessão do <code>localStorage</code> para autenticação real
- [ ] Migrar configurações para o backend
- [ ] Implementar estados de carregamento
- [ ] Tratar erros da API
- [ ] Implementar logout baseado na sessão da API
- [ ] Remover o login/cadastro local de testes

### Fase 4 — Marketplace

- [ ] Implementar pesquisa real
- [ ] Criar publicação de oportunidades
- [ ] Criar publicação de habilidades
- [ ] Implementar participação em oportunidades
- [ ] Implementar conexões entre usuários
- [ ] Implementar mensagens
- [ ] Implementar favoritos/salvos
- [ ] Implementar notificações
- [ ] Implementar filtros e classificações

### Fase 5 — Produção

- [ ] Hospedar o backend
- [ ] Configurar banco de dados de produção
- [ ] Configurar variáveis de ambiente
- [ ] Configurar CORS de produção
- [ ] Utilizar HTTPS
- [ ] Remover definitivamente os mecanismos de autenticação local usados nos testes
- [ ] Revisar segurança e permissões
- [ ] Finalizar documentação da API

---

## Próximos passos

O planejamento mais detalhado da evolução do backend e da integração com o frontend está em [<code>PROXIMOS_PASSOS.md</code>](PROXIMOS_PASSOS.md).

A prioridade atual é concluir a **API de usuários e autenticação** e depois substituir o login local de testes pela autenticação real.

---

## Contribuição

As regras de branches, commits e pull requests estão documentadas em [<code>CONTRIBUTING.md</code>](CONTRIBUTING.md).

---

## Licença

Projeto acadêmico desenvolvido para o **Projeto Integrador Computacional da FAESA**.
