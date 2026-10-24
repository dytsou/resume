import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import {
  createDiagnostic,
  extractUsedPackages,
  findBudgetViolations,
  loadAllowedPackages,
  serializeDiagnostics,
} from '../scripts/modules/latex/diagnostics.mjs';

const resumeTex = readFileSync(join('latex', 'resume.tex'), 'utf8');

test('resume preamble packages are all present in the allowlist', () => {
  const allowed = new Set(loadAllowedPackages());
  const used = extractUsedPackages(resumeTex);
  assert.ok(used.length > 0);
  for (const name of used) {
    assert.ok(allowed.has(name), `missing allowlist entry for ${name}`);
  }
});

test('invented package is reported with the package name in diagnostics', () => {
  const latex = String.raw`\documentclass{article}
\usepackage{titlesec}
\usepackage{totallyunknown}
\begin{document}\end{document}`;
  const diagnostics = findBudgetViolations(latex);
  assert.equal(diagnostics.length, 1);
  assert.equal(diagnostics[0].code, 'out_of_budget_package');
  assert.equal(diagnostics[0].package, 'totallyunknown');
  assert.match(diagnostics[0].message, /totallyunknown/);
});

test('empty diagnostics payload serializes to valid JSON without throwing', () => {
  const json = serializeDiagnostics([]);
  assert.equal(json, '[]');
  assert.deepEqual(JSON.parse(json), []);
  assert.equal(serializeDiagnostics(undefined), '[]');
});

test('createDiagnostic includes optional package and lane fields', () => {
  const diagnostic = createDiagnostic({
    code: 'tex_error',
    message: 'failed',
    package: 'titlesec',
    lane: 'certified',
  });
  assert.equal(diagnostic.lane, 'certified');
  assert.equal(diagnostic.package, 'titlesec');
});
