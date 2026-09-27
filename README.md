# MarketFaesa

[MarketFaesa](https://arthurnunesdev.github.io/Projeto-Integrador-Computacional/) web desenvolvido no Projeto Integrador Computacional da FAESA. O frontend é uma SPA em React publicada no GitHub Pages; o backend em Java está começando agora e ainda não se comunica com o front.

## Funcionalidades

- **Login e cadastro**: telas simples, com troca direta entre login e cadastro. Por enquanto a autenticação é simulada no navegador (usuário `admin` / senha `admin`); o formulário de cadastro valida os campos, mas ainda não salva nada. O botão "Sair", no menu do avatar do cabeçalho, encerra a sessão.
- **Perfil**: página com os dados do usuário logado.
- **Configurações**: tema claro/escuro, privacidade (perfil público, mostrar e-mail, permitir mensagens), notificações e a opção de reduzir animações.
- **Persistência local**: sessão e preferências ficam no `localStorage` (`marketfaesa-auth`, `marketfaesa-theme`, `marketfaesa-config`). Ainda não há chamadas HTTP.

## Tecnologias

| Camada | Stack |
|---|---|
| Frontend | React 19, Vite 8, Tailwind CSS 4, ESLint (JavaScript/JSX) |
| Backend | Java puro (JDK 17+), sem framework e sem ferramenta de build por enquanto |
| Deploy | GitHub Actions + GitHub Pages |

## Arquitetura

```
MarketFaesaWeb/
├── .github/workflows/deploy.yml     # build e deploy do front no GitHub Pages
├── MarketPlace/                     # frontend (React + Vite)
│   ├── public/Imagens/              # ícones SVG, referenciados por caminho (ex.: ./Imagens/Sino.svg)
│   ├── src/
│   │   ├── main.jsx                 # ponto de entrada
│   │   ├── App.jsx                  # estado global: tema, autenticação (localStorage) e navegação
│   │   ├── index.css                # estilos globais
│   │   ├── components/              # "casca" da aplicação: Header, Body, Profile, Configs (.jsx + .css)
│   │   └── auth/                    # tela de login/cadastro: Login.jsx, Login.css
│   ├── index.html
│   ├── vite.config.js
│   ├── eslint.config.js
│   └── package.json
├── backend/                         # backend em Java
│   └── src/br/com/marketfaesa/
│       ├── Main.java
│       ├── model/Usuario.java       # record: id, usuario, nome, email
│       ├── controller/
│       ├── service/
│       └── repository/
├── README.md
└── PROXIMOS_PASSOS.md
```

### Convenções do frontend

- **Organização por funcionalidade**: `components/` guarda a casca da aplicação (cabeçalho, corpo, perfil, configurações), e `auth/` tudo do login/cadastro.
- **CSS ao lado do componente**: cada `Componente.jsx` tem seu `Componente.css` na mesma pasta.
- **Nomes**: pastas em minúsculas; arquivos de componente em PascalCase (`Header.jsx`, `Login.jsx`); hooks em camelCase começando com `use`.
- **CSS global**: os estilos compartilhados são importados em `App.jsx` numa ordem fixa. A ordem importa para a cascata; ao adicionar um import, não reordene os existentes.
- **Assets**: arquivos de `public/` não são importados; são referenciados por caminho relativo (ex.: `./Imagens/Sino.svg`), para funcionar com o `base` do Vite.
- **Onde colocar código novo**:
  - nova tela ou parte da casca → `components/`; funcionalidade maior e independente → nova pasta em `src/` (ex.: `src/loja/`);
  - hooks e utilitários de uma funcionalidade → subpastas `hooks/` e `utils/` dentro dela;
  - chamadas HTTP (futuras) → `src/api/` (ver [PROXIMOS_PASSOS.md](PROXIMOS_PASSOS.md)).

### Fluxo de dados hoje

`App.jsx` concentra o estado (sessão, tema, configurações) e o repassa por props. Cada alteração é gravada no `localStorage` e lida de volta ao carregar a página; não existe servidor envolvido.

### Camadas do backend

- `model`: entidades e objetos de dados (hoje só `Usuario`).
- `repository`: acesso e persistência dos dados.
- `service`: regras de negócio e validações.
- `controller`: entrada das requisições; chama os services, sem regra de negócio.

## Como rodar o frontend

Pré-requisito: Node.js 20+ (a mesma versão usada no deploy).

```bash
cd MarketPlace
npm install
npm run dev       # servidor de desenvolvimento em http://localhost:5173/Projeto-Integrador-Computacional/
```

Outros scripts:

| Comando | O que faz |
|---|---|
| `npm run build` | gera a versão de produção em `MarketPlace/dist` |
| `npm run preview` | serve o build localmente |
| `npm run lint` | roda o ESLint |

## Como compilar e rodar o backend

Pré-requisito: JDK 17 ou superior (`java -version`).

PowerShell, dentro de `backend/`:

```powershell
chcp 65001   # opcional: faz os acentos aparecerem corretamente na saída do console
javac -encoding UTF-8 -d out (Get-ChildItem -Recurse src -Filter *.java).FullName
java -cp out br.com.marketfaesa.Main
```

Bash (Linux, macOS ou Git Bash), dentro de `backend/`:

```bash
javac -encoding UTF-8 -d out $(find src -name "*.java")
java -cp out br.com.marketfaesa.Main
```

As classes compiladas vão para `backend/out/` (ignorada pelo `backend/.gitignore`).

## Deploy

A cada push na branch `main`, o workflow `.github/workflows/deploy.yml` instala as dependências, roda `npm run build` em `MarketPlace/` e publica o `dist` no GitHub Pages. O `base` do Vite está configurado como `/Projeto-Integrador-Computacional/`; se o nome do repositório no Pages mudar, esse valor precisa ser atualizado em `MarketPlace/vite.config.js`.

O GitHub Pages só hospeda arquivos estáticos, então o backend vai precisar de hospedagem separada.

## Próximos passos

O roadmap do backend e da integração com o front está em [PROXIMOS_PASSOS.md](PROXIMOS_PASSOS.md).
