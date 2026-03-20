import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  optimizeDeps: {
    exclude: ['@vue/repl'],
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api/generate': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/output': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  }
})
