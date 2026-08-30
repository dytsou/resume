import { readFileSync } from 'node:fs';
import { load } from 'js-yaml';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

const pkg = JSON.parse(readFileSync(resolve('package.json'), 'utf8'));
const repo = pkg.repository?.url?.replace('git+https://github.com/', '').replace('.git', '') ?? '';

if (!repo) {
  console.error('Could not determine repo from package.json');
  process.exit(1);
}

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

console.log(`Setting SEO_CONFIG_BASE64 on GitHub repo ${repo}...`);

execSync(
  `echo "${encoded}" | gh secret set SEO_CONFIG_BASE64 --repo ${repo} -b -`,
  { stdio: 'inherit' }
);

console.log('\nDone! SEO_CONFIG_BASE64 set on GitHub.');
