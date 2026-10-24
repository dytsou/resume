/**
 * Detect TeX-running tools on PATH.
 */

import { spawnSync } from 'node:child_process';

/**
 * @param {string} binary
 * @returns {boolean}
 */
export function hasBinary(binary) {
  const result = spawnSync('sh', ['-c', `command -v ${JSON.stringify(binary)}`], {
    encoding: 'utf8',
  });
  return result.status === 0 && Boolean(result.stdout?.trim());
}

/**
 * @returns {{ texAvailable: boolean, lwarp: boolean, make4ht: boolean, latexmk: boolean, xelatex: boolean }}
 */
export function detectTexTools() {
  const lwarp = hasBinary('lwarpmk');
  const make4ht = hasBinary('make4ht');
  const latexmk = hasBinary('latexmk');
  const xelatex = hasBinary('xelatex');
  return {
    texAvailable: lwarp || make4ht || (latexmk && xelatex),
    lwarp,
    make4ht,
    latexmk,
    xelatex,
  };
}
