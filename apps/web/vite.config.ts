import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Para onde o proxy manda as chamadas /api. No host é a API local;
// no Docker o Compose define API_PROXY_TARGET=http://api:3333.
const apiProxyTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:3333';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // O front chama /api na mesma origem; o proxy repassa para a API.
    // Assim o cookie de autenticação é first-party (ver CLAUDE.md, seção 7).
    proxy: {
      '/api': { target: apiProxyTarget, changeOrigin: true },
    },
    watch: {
      // Bind mounts do Windows no Docker não propagam eventos de arquivo.
      usePolling: process.env.CHOKIDAR_USEPOLLING === 'true',
    },
  },
});
