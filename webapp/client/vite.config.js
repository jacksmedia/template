import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/test': 'http://localhost:3001',
      '/health': 'http://localhost:3001',
      '/query': 'http://localhost:3001',
      '/api': 'http://localhost:3001' // deployment convention in vercel
    }
  }
})
