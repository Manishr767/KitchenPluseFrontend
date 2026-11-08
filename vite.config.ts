import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// The browser only ever talks to http://localhost:5173. Requests to /api/* are
// forwarded to the Spring Boot backend, so no CORS configuration is needed there.
// changeOrigin is intentionally left off: the Host header stays localhost:5173 and
// matches the browser's Origin header, so Spring treats every request as same-origin.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': { target: 'http://localhost:8080' },
    },
  },
  // Same proxy for `npm run preview` (serving the production build locally).
  preview: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': { target: 'http://localhost:8080' },
    },
  },
})
