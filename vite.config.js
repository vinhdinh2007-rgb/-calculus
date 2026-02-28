import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/-calculus/',
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3001,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-library': ['framer-motion', 'lucide-react'],
        }
      }
    },
    chunkSizeWarningLimit: 600,
    sourcemap: false,
  }
})
