import { defineConfig } from 'vite';

export default defineConfig({
  server: { port: 3260, strictPort: true },
  preview: { port: 3261, strictPort: true },
  build: { target: 'es2022', assetsInlineLimit: 0 },
});
