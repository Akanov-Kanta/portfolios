import { defineConfig } from 'vite';

export default defineConfig({
  server: { port: 3202, strictPort: true },
  preview: { port: 3203, strictPort: true },
  build: { target: 'es2022', assetsInlineLimit: 0 },
});
