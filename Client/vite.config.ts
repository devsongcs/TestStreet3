import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  root: '.',
  server: {
    port: 5173,
    proxy: {
      // Proxy API calls to the backend service during development
      '/Api': {
        target: 'http://localhost:5069',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
