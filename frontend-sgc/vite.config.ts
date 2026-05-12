// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { fileURLToPath, URL } from 'node:url'

// IMPORTANTE:
// - En dev, llama a tu backend por rutas relativas: '/api/...'
// - Vite proxy redirige '/api' → 'http://localhost:3333'
// - Para compartir por cloudflared: tunela el puerto de Vite (5173) y listo.

export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3333', // backend AdonisJS
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, ''), // mejor NO reescribir
      },
    },
    // Permite subdominios de Cloudflare Tunnel: *.trycloudflare.com
    allowedHosts: ['.trycloudflare.com'],
  },
  // Si alguna vez usas "vite preview" + túnel, añade also allowedHosts aquí.
  preview: {
    allowedHosts: ['.trycloudflare.com'],
  },
})
