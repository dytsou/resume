import { readFileSync, writeFileSync } from 'node:fs';
import { load } from 'js-yaml';

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
const valueOnly = process.argv.includes('--value-only');
const setCf = process.argv.includes('--cf');

if (valueOnly) {
  console.log(encoded);
} else if (setCf) {
  const envFile = '.env.secrets.upload';
  writeFileSync(envFile, envLines.join('\n') + '\n');
  console.log(`Written to ${envFile}. Uploading to Cloudflare Pages...`);
  const { execSync } = await import('node:child_process');
  execSync(`wrangler pages secret bulk --project-name dy-tsou-resume --file=${envFile}`, { stdio: 'inherit' });
} else {
  console.log('\n=== Base64 encoded secrets ===\n');
  console.log(encoded);
  console.log('\nCopy the above and add it as a GitHub Secret named `SEO_CONFIG_BASE64`.\n');
  console.log('In the workflow, decode with:');
  console.log('  echo "${{ secrets.SEO_CONFIG_BASE64 }}" | base64 -d > config.yml\n');
  console.log('To upload to Cloudflare Pages:');
  console.log('  pnpm secrets:set -- --cf\n');
}
