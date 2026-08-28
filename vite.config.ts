import { readFileSync, existsSync } from 'node:fs';
import { defineConfig } from 'vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import { createStaticIndex } from './scripts/shared/static-index.mjs';

const deployBase =
  process.env.BASE_PATH ??
  (process.env.GITHUB_PAGES === 'true' || process.env.CF_PAGES === '1'
    ? '/resume/'
    : '/');

// Cloudflare Worker subpath routes (dy.tsou.me/resume*) serve files under dist/resume/.
const workerSubpath = process.env.WORKER_SUBPATH === 'true';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    {
      name: 'static-resume-index',
      transformIndexHtml(html: string) {
        const resumePath = 'public/converted-docs/resume.html';
        const source = existsSync(resumePath)
          ? readFileSync(resumePath, 'utf8')
          : '';
        return createStaticIndex(
          html,
          source,
          process.env.VITE_GOOGLE_DRIVE_RESUME_LINK
        );
      },
    },
    cloudflare(),
  ],
  base: deployBase,
  build: {
    outDir: workerSubpath ? 'dist/resume' : 'dist',
  },
  optimizeDeps: {},
});
