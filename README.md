# MarketFaesa

[MarketFaesa](https://arthurnunesdev.github.io/Projeto-Integrador-Computacional/) é um marketplace universitário desenvolvido no Projeto Integrador Computacional da FAESA.

A proposta é conectar estudantes de diferentes cursos para divulgar habilidades, encontrar oportunidades e criar conexões acadêmicas e profissionais.

## Situação atual

O **frontend em React** já possui uma interface funcional e responsiva. O **backend em Java com Spring Boot** está em desenvolvimento e a integração definitiva ainda será realizada.

### Funcionalidades disponíveis

- 🔐 Login e cadastro local para testes
- 🏠 Dashboard com estatísticas e oportunidades
- 👤 Perfil do usuário com progresso de preenchimento
- ✨ Animação de conquista ao completar 100% do perfil
- 🛠️ Publicação e gerenciamento de habilidades
- 👥 Busca de estudantes e conexões
- 💬 Mensagens entre usuários
- 🔖 Itens salvos
- 📋 Minhas publicações
- ⚙️ Configurações de conta e preferências
- 🌙 Tema claro e escuro
- 📱 Interface responsiva para desktop e mobile
- 🎨 Identidade visual própria do MarketFaesa

## Tecnologias

| Frontend | Backend |
|---|---|
| React | Java 21 |
| Vite | Spring Boot |
| JavaScript / JSX | Spring Security |
| CSS | Spring Validation |
| localStorage | Maven |

Atualmente, os dados do frontend são persistidos principalmente no **localStorage**, enquanto a API e a persistência definitiva estão sendo desenvolvidas no backend.

> **Importante:** o login local é apenas para desenvolvimento e testes. A versão final deverá utilizar autenticação e persistência pelo backend, sem armazenar senhas em texto puro no navegador.

## Estrutura

~~~text
Projeto-Integrador-Computacional/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── MarketPlace/
│   ├── public/
│   └── src/
│       ├── auth/
│       ├── components/
│       ├── App.jsx
│       └── index.css
├── backend/
├── CONTRIBUTING.md
├── PROXIMOS_PASSOS.md
└── README.md
~~~

## Identidade visual

A interface utiliza principalmente:

- **Azul-marinho:** \`#1E2761\`
- **Azul-claro:** \`#CADCFC\`
- **Laranja:** \`#D98324\`

O projeto possui símbolo e favicon próprios do MarketFaesa, além de suporte a tema claro e escuro.

## Como executar

### Frontend

Pré-requisito: Node.js 20 ou superior.

~~~bash
cd MarketPlace
npm install
npm run dev
~~~

Para gerar o build:

~~~bash
npm run build
~~~

### Backend

Pré-requisito: JDK 21 ou superior.

No Windows:

~~~powershell
cd backend
.\mvnw.cmd spring-boot:run
~~~

No Linux/macOS:

~~~bash
cd backend
./mvnw spring-boot:run
~~~

## Deploy

O frontend é publicado automaticamente no **GitHub Pages** através do GitHub Actions sempre que há alterações na branch \`main\`.

🌐 **Site:** https://arthurnunesdev.github.io/Projeto-Integrador-Computacional/

## Próximos passos

- Finalizar a API de usuários e autenticação
- Criar a persistência definitiva dos dados
- Integrar o frontend com o backend
- Substituir o login local pela autenticação real
- Implementar as funcionalidades do marketplace com dados reais

O planejamento do projeto está em [PROXIMOS_PASSOS.md](PROXIMOS_PASSOS.md).

## Projeto acadêmico

Desenvolvido para o **Projeto Integrador Computacional da FAESA**.
