import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { compileDocument } from '../compile/tex-engine.mjs';

const resumePath = join(process.cwd(), 'latex', 'resume.tex');

describe('compileDocument (unified-latex stub)', () => {
  it('returns structured success for resume source', () => {
    const source = readFileSync(resumePath, 'utf8');
    const result = compileDocument({ source, filename: 'resume' });

    expect(result.success).toBe(true);
    expect(result.html).toContain('<!DOCTYPE html>');
    expect(result.metadata?.title).toBeTruthy();
    expect(result.error).toBeNull();
  });

  it('returns structured failure for malformed LaTeX', () => {
    const result = compileDocument({
      source: '\\documentclass{article}\\begin{document}\\broken',
      filename: 'bad',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
    expect(result.html).toBeUndefined();
  });

  it('returns structured failure for empty source', () => {
    const result = compileDocument({ source: '', filename: 'empty' });

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
