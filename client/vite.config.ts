import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/auth': 'http://localhost:3000',
      '/staff': 'http://localhost:3000',
      '/products': 'http://localhost:3000',
      '/sales': 'http://localhost:3000',
      '/customers': 'http://localhost:3000',
      '/categories': 'http://localhost:3000',
      '/settings': 'http://localhost:3000',
      '/subscription': 'http://localhost:3000',
      '/suppliers': 'http://localhost:3000',
      '/bulk': 'http://localhost:3000',
      '/brands': 'http://localhost:3000',
      '/units': 'http://localhost:3000',
      '/purchases': 'http://localhost:3000'
    }
  }
})
