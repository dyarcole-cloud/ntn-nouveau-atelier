import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Single-page app. PWA static assets (manifest, sw.js, icons) live in /public
// and are emitted to the dist root unchanged.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
