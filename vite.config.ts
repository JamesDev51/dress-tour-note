import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
    target: 'es2022',
    chunkSizeWarningLimit: 1400,
    rollupOptions: {
      output: {
        manualChunks: {
          pdf: ['pdf-lib', 'pdfjs-dist'],
          data: ['dexie', 'zustand'],
        },
      },
    },
  },
})
