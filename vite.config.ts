import { readFileSync, existsSync } from 'node:fs';
import { defineConfig } from 'vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import { createStaticIndex } from './scripts/shared/static-index.mjs';
import { SEO, DRIVE_LINK } from './scripts/shared/config.mjs';

const deployBase =
  process.env.BASE_PATH ??
  (process.env.GITHUB_PAGES === 'true' || process.env.CF_PAGES === '1'
    ? '/resume/'
    : '/');

const workerSubpath = process.env.WORKER_SUBPATH === 'true';

export default defineConfig({
  plugins: [
    {
      name: 'static-resume-index',
      transformIndexHtml(html: string) {
        const resumePath = 'public/converted-docs/resume.html';
        const source = existsSync(resumePath)
          ? readFileSync(resumePath, 'utf8')
          : '';
        return createStaticIndex(html, source, DRIVE_LINK, {
          title: `${SEO.name} — Resume`,
          name: SEO.name,
          description: SEO.description,
          canonicalUrl: SEO.canonicalUrl,
          ogTitle: `${SEO.name} — Resume`,
          ogDescription: SEO.description,
          ogType: 'profile',
          ogUrl: SEO.url,
          url: SEO.url,
        });
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
