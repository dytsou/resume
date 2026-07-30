#!/usr/bin/env node
/**
 * Cloudflare release helper for Workers Builds + local use.
 *
 * - main (or --production): wrangler deploy → live production
 * - any other branch (or --snapshot): wrangler versions upload → preview snapshot only
 *
 * Workers Builds injects WORKERS_CI_BRANCH. Prefer that over GITHUB_REF_NAME.
 */
import { spawnSync } from 'node:child_process';

/**
 * @param {{ forceProduction?: boolean, forceSnapshot?: boolean, branch?: string }} opts
 * @returns {{ mode: 'production' | 'snapshot', alias: string, branch: string }}
 */
export function resolveReleaseMode({
  forceProduction = false,
  forceSnapshot = false,
  branch = '',
} = {}) {
  if (forceProduction && forceSnapshot) {
    throw new Error('Choose only one of --production or --snapshot');
  }
  const normalized = branch.trim();
  const isProduction =
    forceProduction || (!forceSnapshot && normalized === 'main');
  return {
    mode: isProduction ? 'production' : 'snapshot',
    branch: normalized,
    alias: previewAlias(normalized || 'snapshot'),
  };
}

/** @param {string} name */
export function previewAlias(name) {
  const alias = name
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);
  return alias || 'preview';
}

function run(cmd, cmdArgs) {
  console.log(`+ ${cmd} ${cmdArgs.join(' ')}`);
  const result = spawnSync(cmd, cmdArgs, { stdio: 'inherit', shell: false });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function main(argv = process.argv.slice(2)) {
  const args = new Set(argv);
  const forceProduction = args.has('--production');
  const forceSnapshot = args.has('--snapshot');
  const branch =
    process.env.WORKERS_CI_BRANCH || process.env.GITHUB_REF_NAME || '';

  let release;
  try {
    release = resolveReleaseMode({ forceProduction, forceSnapshot, branch });
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  }

  const wranglerConfig = ['--config', 'wrangler.jsonc'];

  if (release.mode === 'production') {
    console.log(
      `Cloudflare release: PRODUCTION (branch=${release.branch || 'main'})`
    );
    run('pnpm', ['exec', 'wrangler', 'deploy', ...wranglerConfig, '--env=']);
    return;
  }

  console.log(
    `Cloudflare release: SNAPSHOT only (branch=${release.branch || '(unknown)'}, alias=${release.alias})`
  );
  run('pnpm', [
    'exec',
    'wrangler',
    'versions',
    'upload',
    ...wranglerConfig,
    '--preview-alias',
    release.alias,
  ]);
}

const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith('cf-deploy.mjs') ||
    process.argv[1].endsWith('cf-deploy.js'));

if (isDirectRun) {
  main();
}
