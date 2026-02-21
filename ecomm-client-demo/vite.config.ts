import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 9006,
    proxy: {
      '/api': {
        target: 'http://localhost:9004',
        changeOrigin: true,
      },
    },
  },
});
