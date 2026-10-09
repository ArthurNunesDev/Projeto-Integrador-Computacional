import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// Mesmo padrão de src/api/client.js.
const API_URL_PADRAO = 'http://localhost:8080'

// Origem da API (sem caminho) para o connect-src; vem de VITE_API_URL, sem fixar host.
function origemDaApi(env) {
  const url = env.VITE_API_URL || API_URL_PADRAO
  try {
    return new URL(url).origin
  } catch {
    throw new Error(`VITE_API_URL inválida: "${url}" (use uma URL absoluta, ex.: http://localhost:8080)`)
  }
}

// CSP só no build: em dev o react-refresh injeta script inline e o HMR usa websocket.
function montarCsp(origemApi) {
  return (
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; " +
    `connect-src 'self' ${origemApi}; object-src 'none'; base-uri 'self'; form-action 'self'`
  )
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, fileURLToPath(new URL('.', import.meta.url)), 'VITE_')
  const csp = montarCsp(origemDaApi(env))

  // Não falha o build: o deploy do GitHub Pages ainda não tem API publicada.
  if (mode === 'production' && !env.VITE_API_URL) {
    console.warn(
      `\n[aviso] VITE_API_URL não definida: este build de produção vai chamar a API em ${API_URL_PADRAO}.\n` +
        '        Defina VITE_API_URL (no deploy, a variável do repositório) com a URL pública da API.\n',
    )
  }

  return {
    plugins: [
      react(),
      {
        name: 'csp-meta',
        apply: 'build',
        transformIndexHtml: () => [
          { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: csp }, injectTo: 'head-prepend' },
        ],
      },
    ],
    base: '/Projeto-Integrador-Computacional/',
    test: {
      environment: 'jsdom',
      setupFiles: ['@testing-library/jest-dom/vitest'],
    },
  }
})
