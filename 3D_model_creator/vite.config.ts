import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',  // Forward requests to backend
        changeOrigin: true,
        secure: false,  // Allow HTTP (not HTTPS) during development
        rewrite: (path) => path.replace(/^\/api/, ''),  // Rewrite URLs correctly
      },
    },
  },
});
