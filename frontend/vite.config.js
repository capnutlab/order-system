import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      input: {
        trial: resolve(__dirname, 'trial.html'),
        app: resolve(__dirname, 'app.html'),
      },
    },
    outDir: '../dist',
    emptyOutDir: true,
  },
  base: './',
})
