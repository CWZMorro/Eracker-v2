import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    // `npm run dev` reads the data from a running Eracker server (see README)
    proxy: { '/api': process.env.ERACKER_API ?? 'http://localhost:5007' },
  },
});
