/**
 * Structured convert diagnostics for certified / fuzzy lanes.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const texDir = join(here, '../../tex');

/**
 * @param {{ code: string, message: string, package?: string, lane?: string }} fields
 */
export function createDiagnostic(fields) {
  const diagnostic = {
    code: fields.code,
    message: fields.message,
  };
  if (fields.package !== undefined) {
    diagnostic.package = fields.package;
  }
  if (fields.lane !== undefined) {
    diagnostic.lane = fields.lane;
  }
  return diagnostic;
}

/**
 * @param {unknown} diagnostics
 * @returns {string}
 */
export function serializeDiagnostics(diagnostics) {
  const list = Array.isArray(diagnostics) ? diagnostics : [];
  return JSON.stringify(list);
}

/**
 * Load certified package allowlist.
 * @returns {string[]}
 */
export function loadAllowedPackages() {
  return JSON.parse(readFileSync(join(texDir, 'allowed-packages.json'), 'utf8'));
}

/**
 * Load certified document-class allowlist.
 * @returns {string[]}
 */
export function loadAllowedDocumentClasses() {
  return JSON.parse(
    readFileSync(join(texDir, 'allowed-document-classes.json'), 'utf8')
  );
}

/**
 * Extract `\usepackage` base names from LaTeX source.
 * @param {string} latexContent
 * @returns {string[]}
 */
export function extractUsedPackages(latexContent) {
  const names = new Set();
  const re = /\\usepackage(?:\[[^\]]*\])?\{([^}]+)\}/g;
  let match;
  while ((match = re.exec(latexContent)) !== null) {
    for (const part of match[1].split(',')) {
      const name = part.trim();
      if (name) {
        names.add(name);
      }
    }
  }
  return [...names];
}

/**
 * Extract `\documentclass` base name from LaTeX source.
 * @param {string} latexContent
 * @returns {string | null}
 */
export function extractDocumentClass(latexContent) {
  const match = /\\documentclass(?:\[[^\]]*\])?\{([^}]+)\}/.exec(latexContent);
  return match ? match[1].trim() : null;
}

/**
 * Return diagnostics for packages / class outside the certified budget.
 * @param {string} latexContent
 * @param {{ packages?: string[], documentClasses?: string[], lane?: string }} [options]
 * @returns {ReturnType<typeof createDiagnostic>[]}
 */
export function findBudgetViolations(latexContent, options = {}) {
  const packages = options.packages ?? loadAllowedPackages();
  const documentClasses =
    options.documentClasses ?? loadAllowedDocumentClasses();
  const allowedPackages = new Set(packages);
  const allowedClasses = new Set(documentClasses);
  const lane = options.lane ?? 'certified';
  const diagnostics = [];

  const documentClass = extractDocumentClass(latexContent);
  if (documentClass && !allowedClasses.has(documentClass)) {
    diagnostics.push(
      createDiagnostic({
        code: 'out_of_budget_documentclass',
        message: `Document class "${documentClass}" is outside the certified fidelity budget`,
        package: documentClass,
        lane,
      })
    );
  }

  for (const name of extractUsedPackages(latexContent)) {
    if (!allowedPackages.has(name)) {
      diagnostics.push(
        createDiagnostic({
          code: 'out_of_budget_package',
          message: `Package "${name}" is outside the certified fidelity budget`,
          package: name,
          lane,
        })
      );
    }
  }

  return diagnostics;
}
