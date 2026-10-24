/**
 * Detect TeX-running tools via fixed binary directories (no shell PATH lookup).
 */

import { accessSync, constants } from 'node:fs';
import { homedir } from 'node:os';
import { delimiter, dirname, join } from 'node:path';

/** Fixed install locations — CI TeX Live, Homebrew, and system bins. */
const BIN_DIRS = [
  join(homedir(), 'texlive/bin/x86_64-linux'),
  join(homedir(), 'texlive/bin/aarch64-linux'),
  '/usr/local/texlive/bin/universal-darwin',
  '/Library/TeX/texbin',
  '/opt/homebrew/bin',
  '/usr/local/bin',
  '/usr/bin',
  '/bin',
];

/**
 * @param {string} binary
 * @returns {string | null} absolute path when executable
 */
export function resolveBinary(binary) {
  for (const dir of BIN_DIRS) {
    const candidate = join(dir, binary);
    try {
      accessSync(candidate, constants.X_OK);
      return candidate;
    } catch {
      // try next dir
    }
  }
  return null;
}

/**
 * Ensure TeX siblings (texlua, xelatex) remain resolvable when spawning via absolute path.
 * @param {string | null | undefined} binaryPath
 * @param {NodeJS.ProcessEnv} [baseEnv]
 * @returns {NodeJS.ProcessEnv}
 */
export function texSpawnEnv(binaryPath, baseEnv = process.env) {
  const env = { ...baseEnv };
  if (typeof binaryPath === 'string' && /[/\\]/.test(binaryPath)) {
    env.PATH = `${dirname(binaryPath)}${delimiter}${env.PATH ?? ''}`;
  }
  return env;
}

/**
 * @returns {{
 *   texAvailable: boolean,
 *   make4ht: boolean,
 *   latexmk: boolean,
 *   xelatex: boolean,
 *   paths: { make4ht: string | null, latexmk: string | null, xelatex: string | null }
 * }}
 */
export function detectTexTools() {
  const paths = {
    make4ht: resolveBinary('make4ht'),
    latexmk: resolveBinary('latexmk'),
    xelatex: resolveBinary('xelatex'),
  };
  const make4ht = Boolean(paths.make4ht);
  const latexmk = Boolean(paths.latexmk);
  const xelatex = Boolean(paths.xelatex);
  return {
    // Certified lane is make4ht-only; latexmk/xelatex alone are not enough.
    texAvailable: make4ht,
    make4ht,
    latexmk,
    xelatex,
    paths,
  };
}
