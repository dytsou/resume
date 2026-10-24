import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getResumeFrameworkCss,
  RESUME_FRAMEWORK,
} from '../scripts/modules/html/resume-framework.mjs';

test('framework CSS matches production sheet + layout primitives', () => {
  const css = getResumeFrameworkCss();
  assert.match(css, /\.resume-page\s*\{/);
  assert.match(css, /max-width:\s*210mm/);
  assert.match(css, /font-family:\s*"Source Sans Pro"/);
  assert.match(css, /font-size:\s*13px/);
  assert.match(css, /line-height:\s*1\.2/);
  assert.match(css, /letter-spacing:\s*-0\.015em/);
  assert.match(css, /\.contact-name\s*\{/);
  assert.match(css, /\.trio\s*\{/);
  assert.match(css, /\.skill-row\s*\{/);
  assert.match(css, /grid-template-columns:\s*180px 1fr/);
  assert.match(css, /@media\s*\(max-width:\s*768px\)/);
  assert.doesNotMatch(css, /--rf-page-bg/);
  assert.doesNotMatch(css, /text-wrap:\s*pretty/);
  assert.doesNotMatch(css, /min-height:\s*297mm/);
});

test('RESUME_FRAMEWORK class contract stays stable', () => {
  assert.equal(RESUME_FRAMEWORK.sheet, 'resume-page');
  assert.equal(RESUME_FRAMEWORK.trio, 'trio');
  assert.equal(RESUME_FRAMEWORK.footer, 'converter-footer');
});
