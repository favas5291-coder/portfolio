import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { host: '0.0.0.0', port: 4173, strictPort: true, allowedHosts: ['terminal.local'] },
  preview: { host: '0.0.0.0', port: 4173, allowedHosts: ['terminal.local'] },
  build: { target: 'es2022', sourcemap: false },
});
