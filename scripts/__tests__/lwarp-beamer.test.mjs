import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { compileDocument } from '../compile/tex-engine.mjs';
import { isTexAvailable } from '../compile/tex-available.mjs';
import { pdfNonEmpty } from '../compile/lwarp.mjs';

const beamerPath = join(process.cwd(), 'tests/fixtures/beamer-minimal.tex');
const beamerSource = readFileSync(beamerPath, 'utf8');

describe.skipIf(!isTexAvailable())('lwarp beamer compile', () => {
  it('produces HTML with frames and PDF', () => {
    const result = compileDocument({
      source: beamerSource,
      filename: 'beamer-minimal.tex',
      id: 'beamer-minimal',
    });
    expect(result.success).toBe(true);
    expect(result.html).toContain('<!DOCTYPE html>');
    expect(result.html?.toLowerCase()).toMatch(/first slide|hello from beamer/);
    expect(result.pdfPath && pdfNonEmpty(result.pdfPath)).toBe(true);
  });
});
