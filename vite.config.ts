import { readFileSync, existsSync } from 'node:fs';
import { defineConfig } from 'vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import { load } from 'js-yaml';
import { resolve } from 'node:path';
import { createStaticIndex } from './scripts/shared/static-index.mjs';

const configPath = resolve(process.cwd(), 'config.yml');
const _config = existsSync(configPath) ? (load(readFileSync(configPath, 'utf8')) as Record<string, unknown> | null) : null;
const _seo = _config?.seo as Record<string, string> | null;
const _driveLink = (_config?.driveLink as string | null) ?? '';

const SEO_NAME = _seo?.name ?? process.env.SEO_NAME ?? 'Your Name';
const SEO_DESCRIPTION = _seo?.description ?? process.env.SEO_DESCRIPTION ?? '';
const SEO_URL = _seo?.url ?? process.env.SEO_URL ?? 'https://yourdomain.com/resume/';
const SEO_CANONICAL_URL = _seo?.canonicalUrl ?? process.env.SEO_CANONICAL_URL ?? process.env.SEO_URL ?? '';
const DRIVE_LINK = _driveLink || (process.env.VITE_GOOGLE_DRIVE_RESUME_LINK ?? '');

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
          title: `${SEO_NAME} — Resume`,
          name: SEO_NAME,
          description: SEO_DESCRIPTION,
          canonicalUrl: SEO_CANONICAL_URL,
          ogTitle: `${SEO_NAME} — Resume`,
          ogDescription: SEO_DESCRIPTION,
          ogType: 'profile',
          ogUrl: SEO_URL,
          url: SEO_URL,
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
