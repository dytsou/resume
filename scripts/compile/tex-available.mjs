import { execSync } from 'node:child_process';

let cached;

/** @returns {boolean} */
export function isTexAvailable() {
  if (cached !== undefined) return cached;
  try {
    execSync('xelatex --version', { stdio: 'ignore' });
    execSync('lwarpmk --version', { stdio: 'ignore' });
    cached = true;
  } catch {
    cached = false;
  }
  return cached;
}
