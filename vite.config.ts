import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { cloudflare } from '@cloudflare/vite-plugin';

const deployBase =
  process.env.BASE_PATH ??
  (process.env.GITHUB_PAGES === 'true' || process.env.CF_PAGES === '1'
    ? '/resume/'
    : '/');

// Cloudflare Worker subpath routes (dy.tsou.me/resume*) serve files under dist/resume/.
const workerSubpath = process.env.WORKER_SUBPATH === 'true';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), cloudflare()],
  base: deployBase,
  build: {
    outDir: workerSubpath ? 'dist/resume' : 'dist',
  },
  optimizeDeps: {},
});
