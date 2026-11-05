import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In development, Vite forwards these paths to the API: the browser sees a
// single origin, as it will in production.
const API_TARGET = 'http://localhost:5030'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': API_TARGET,
      '/uploads': API_TARGET,
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/tests/setup.js',
  },
})
