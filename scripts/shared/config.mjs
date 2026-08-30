/**
 * Configuration constants for LaTeX to HTML conversion
 */

import { readFileSync, existsSync } from 'node:fs';
import { load } from 'js-yaml';

function loadConfig() {
  const configPath = new URL('../../config.yml', import.meta.url);
  if (existsSync(configPath)) {
    const config = load(readFileSync(configPath, 'utf8'));
    return {
      seo: config.seo,
      driveLink: config.driveLink ?? '',
    };
  }
  return {
    seo: {
      name: process.env.SEO_NAME ?? 'Your Name',
      nameZh: process.env.SEO_NAME_ZH ?? '',
      id: process.env.SEO_ID ?? 'your-id',
      description: process.env.SEO_DESCRIPTION ?? '',
      url: process.env.SEO_URL ?? 'https://yourdomain.com/resume/',
      canonicalUrl: process.env.SEO_CANONICAL_URL ?? process.env.SEO_URL ?? '',
    },
    driveLink: process.env.VITE_GOOGLE_DRIVE_RESUME_LINK ?? '',
  };
}

const { seo: _seo, driveLink: _driveLink } = loadConfig();
export const SEO = _seo;
export const DRIVE_LINK = _driveLink;

export const CONFIG = {
  latexDir: './latex',
  outputDir: './public/converted-docs',
  manifestFile: './public/documents-manifest.json',
};

export const ICON_MAP = {
  faLinkedin: 'fab fa-linkedin',
  faGithub: 'fab fa-github',
  faEnvelope: 'fas fa-envelope',
  faMobile: 'fas fa-mobile',
};

export const LIST_MARKERS = {
  start: '<span class="macro macro-resumeItemListStart"></span>',
  end: '<span class="macro macro-resumeItemListEnd"></span>',
  item: '<span class="macro macro-resumeItem"></span>',
};
