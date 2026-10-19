import { defineConfig } from 'vite';

export default defineConfig({
  server: { port: 3205, strictPort: true },
  preview: { port: 3206, strictPort: true },
  build: { target: 'es2022', assetsInlineLimit: 0 },
});
