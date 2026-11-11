import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/dashboard/',
  publicDir: 'static',
  build: {
    outDir: 'public',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/dashboard/api': {
        target: 'http://127.0.0.1:3847',
        changeOrigin: true
      }
    }
  }
});
