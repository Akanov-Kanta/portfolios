import { defineConfig } from 'vite';

export default defineConfig({
  server: { port: 3207, strictPort: true, host: '127.0.0.1' },
  preview: { port: 3208, strictPort: true },
  build: { target: 'es2022', assetsInlineLimit: 0 },
});
