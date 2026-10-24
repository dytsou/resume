/**
 * Detect TeX-running tools via fixed binary directories (no shell PATH lookup).
 */

import { accessSync, constants } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

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
 * @param {string} binary
 * @returns {boolean}
 */
export function hasBinary(binary) {
  return resolveBinary(binary) !== null;
}

/**
 * @returns {{
 *   texAvailable: boolean,
 *   lwarp: boolean,
 *   make4ht: boolean,
 *   latexmk: boolean,
 *   xelatex: boolean,
 *   paths: { lwarpmk: string | null, make4ht: string | null, latexmk: string | null, xelatex: string | null }
 * }}
 */
export function detectTexTools() {
  const paths = {
    lwarpmk: resolveBinary('lwarpmk'),
    make4ht: resolveBinary('make4ht'),
    latexmk: resolveBinary('latexmk'),
    xelatex: resolveBinary('xelatex'),
  };
  const lwarp = Boolean(paths.lwarpmk);
  const make4ht = Boolean(paths.make4ht);
  const latexmk = Boolean(paths.latexmk);
  const xelatex = Boolean(paths.xelatex);
  return {
    texAvailable: lwarp || make4ht || (latexmk && xelatex),
    lwarp,
    make4ht,
    latexmk,
    xelatex,
    paths,
  };
}
