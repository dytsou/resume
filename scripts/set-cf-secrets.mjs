import { readFileSync } from 'node:fs';
import { load } from 'js-yaml';
import { execSync } from 'node:child_process';

const raw = readFileSync('.env', 'utf8');
const env = Object.fromEntries(
  raw
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => l.split('=').map((v) => v.trim()))
);

const config = load(readFileSync('config.yml', 'utf8'));

const envLines = [
  `SEO_NAME=${config.seo.name}`,
  `SEO_NAME_ZH=${config.seo.nameZh}`,
  `SEO_ID=${config.seo.id}`,
  `SEO_DESCRIPTION=${config.seo.description}`,
  `SEO_URL=${config.seo.url}`,
  `SEO_CANONICAL_URL=${config.seo.canonicalUrl}`,
  `VITE_GOOGLE_DRIVE_RESUME_LINK=${config.driveLink}`,
];

const encoded = Buffer.from(envLines.join('\n')).toString('base64');
const projectName = env.CF_PAGES_PROJECT;

if (!projectName) {
  console.error('CF_PAGES_PROJECT not set in .env');
  process.exit(1);
}

console.log(`Uploading SEO_CONFIG_BASE64 to Cloudflare Pages project: ${projectName}`);

execSync(
  `echo "${encoded}" | wrangler pages secret put SEO_CONFIG_BASE64 --project-name ${projectName}`,
  { stdio: 'inherit' }
);

console.log('\nDone! SEO_CONFIG_BASE64 uploaded to Cloudflare Pages.');
