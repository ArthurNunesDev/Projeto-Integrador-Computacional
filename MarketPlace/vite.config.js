import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// CSP só no build: em dev o react-refresh injeta script inline e o HMR usa websocket.
const csp =
  "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; " +
  "connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'"

export default defineConfig({
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
})
