import { defineConfig } from 'vite';

export default defineConfig({
  server: { port: 3201, strictPort: true, host: '127.0.0.1' },
  preview: { port: 3204, strictPort: true },
  build: { target: 'es2022' },
});
