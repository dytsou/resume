import { spawnSync } from 'node:child_process';

let cached;

/** @returns {Record<string, string>} */
function texProbeEnv() {
  const segments = [
    process.env.TEXLIVE_BIN,
    '/home/runner/texlive/bin/x86_64-linux',
    '/usr/local/texlive/current/bin/x86_64-linux',
    '/usr/local/bin',
    '/usr/bin',
    '/bin',
  ].filter(Boolean);
  return { ...process.env, PATH: segments.join(':') };
}

/**
 * @param {string} cmd
 * @returns {boolean}
 */
function commandOk(cmd) {
  const result = spawnSync(cmd, ['--version'], {
    stdio: 'ignore',
    env: texProbeEnv(),
  });
  return result.status === 0;
}

/** @returns {boolean} */
export function isTexAvailable() {
  if (cached !== undefined) return cached;
  cached = commandOk('xelatex') && commandOk('lwarpmk');
  return cached;
}
