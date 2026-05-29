import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/tools/museum/',
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5175,
    strictPort: true,
    allowedHosts: [
      '.butterfly-gen.online',
      '.butterfly-gen.com',
      'localhost',
      '127.0.0.1',
      '8.153.105.107',
    ],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
    },
  },
});
