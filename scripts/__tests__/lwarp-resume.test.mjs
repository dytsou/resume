import { describe, expect, it } from 'vitest';

import { validatePreamble } from '../compile/validate-preamble.mjs';
import { isTexAvailable } from '../compile/tex-available.mjs';
import { compileDocument } from '../compile/tex-engine.mjs';
import { pdfNonEmpty } from '../compile/lwarp.mjs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const resumePath = join(process.cwd(), 'latex', 'resume.tex');
const resumeSource = readFileSync(resumePath, 'utf8');

describe('validatePreamble', () => {
  it('rejects unknown packages', () => {
    const bad = resumeSource.replace(
      '\\usepackage{verbatim}',
      '\\usepackage{verbatim}\n\\usepackage{totallyunknown}'
    );
    const result = validatePreamble(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('totallyunknown');
    }
  });
});

describe.skipIf(!isTexAvailable())('lwarp resume compile', () => {
  it('produces HTML with title and PDF', () => {
    const result = compileDocument({
      source: resumeSource,
      filename: 'resume.tex',
      id: 'resume',
    });
    expect(result.success).toBe(true);
    expect(result.html).toContain('<!DOCTYPE html>');
    expect(result.html?.toLowerCase()).toMatch(/experience|education|skills/);
    expect(result.pdfPath && pdfNonEmpty(result.pdfPath)).toBe(true);
  });
});
