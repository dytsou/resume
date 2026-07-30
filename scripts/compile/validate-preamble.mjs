import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const texDir = join(dirname(fileURLToPath(import.meta.url)), '../tex');

const allowedPackages = JSON.parse(
  readFileSync(join(texDir, 'allowed-packages.json'), 'utf8')
);
const allowedClasses = JSON.parse(
  readFileSync(join(texDir, 'allowed-document-classes.json'), 'utf8')
);

/**
 * @param {string} source
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export function validatePreamble(source) {
  const classMatch = source.match(/\\documentclass(?:\[[^\]]*\])?\{([^}]+)\}/);
  if (!classMatch) {
    return { ok: false, error: 'Missing \\documentclass' };
  }
  const docClass = classMatch[1].trim();
  if (!allowedClasses.includes(docClass)) {
    return {
      ok: false,
      error: `Unsupported document class: ${docClass}`,
    };
  }

  const usePackageRe = /\\usepackage(?:\[[^\]]*\])?\{([^}]+)\}/g;
  let match;
  while ((match = usePackageRe.exec(source)) !== null) {
    const names = match[1].split(',').map((n) => n.trim());
    for (const name of names) {
      if (!allowedPackages.includes(name)) {
        return { ok: false, error: `Unsupported package: ${name}` };
      }
    }
  }

  return { ok: true };
}
