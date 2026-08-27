import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getStyles,
  wrapInHtmlTemplate,
} from '../scripts/modules/html/template.mjs';

test('wraps converted content in a complete HTML document', () => {
  const html = wrapInHtmlTemplate('<p>Resume</p>', { title: 'Resume' });

  assert.match(html, /^<!DOCTYPE html>/);
  assert.match(html, /<title>Resume<\/title>/);
  assert.match(html, /<main class="resume-page"><p>Resume<\/p><\/main>/);
  assert.match(getStyles(), /\.resume-page/);
});
