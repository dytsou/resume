import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { compileDocument } from '../compile/tex-engine.mjs';
import { isTexAvailable } from '../compile/tex-available.mjs';
import { validatePreamble } from '../compile/validate-preamble.mjs';

const resumePath = join(process.cwd(), 'latex', 'resume.tex');

describe('compileDocument validation', () => {
  it('returns structured success for resume source when TeX available', () => {
    if (!isTexAvailable()) {
      const source = readFileSync(resumePath, 'utf8');
      const result = compileDocument({ source, filename: 'resume.tex' });
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/TeX Live not found/);
      return;
    }
    const source = readFileSync(resumePath, 'utf8');
    const result = compileDocument({ source, filename: 'resume.tex' });
    expect(result.success).toBe(true);
    expect(result.html).toContain('<!DOCTYPE html>');
    expect(result.metadata?.title).toBeTruthy();
  }, 30_000);

  it('returns structured failure for malformed LaTeX', () => {
    const result = compileDocument({
      source: '\\documentclass{article}\\begin{document}\\broken',
      filename: 'bad.tex',
    });
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('returns structured failure for empty source', () => {
    const result = compileDocument({ source: '', filename: 'empty.tex' });
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('rejects unsupported package before TeX', () => {
    const source = readFileSync(resumePath, 'utf8').replace(
      '\\usepackage{verbatim}',
      '\\usepackage{totallyunknown}'
    );
    const result = compileDocument({ source, filename: 'resume.tex' });
    expect(result.success).toBe(false);
    expect(result.error).toContain('totallyunknown');
  });

  it('rejects path traversal in filename', () => {
    const source = readFileSync(resumePath, 'utf8');
    const result = compileDocument({
      source,
      filename: '../../tmp/evil.tex',
    });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Invalid filename/);
  });
});

describe('validatePreamble beamerarticle', () => {
  it('allows article class with beamerarticle package', () => {
    const fixture = readFileSync(
      join(process.cwd(), 'tests/fixtures/beamer-minimal.tex'),
      'utf8'
    );
    expect(validatePreamble(fixture).ok).toBe(true);
  });

  it('rejects unsupported beamer document class', () => {
    expect(
      validatePreamble(
        '\\documentclass{beamer}\\begin{document}\\end{document}'
      ).ok
    ).toBe(false);
  });
});
