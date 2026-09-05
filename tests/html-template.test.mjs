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

test('defines light and dark semantic tokens for the complete resume surface', () => {
  const styles = getStyles();

  assert.match(styles, /:root\s*\{[\s\S]*color-scheme:\s*light/);
  assert.match(styles, /--page-bg:\s*#faf8f2/);
  assert.match(styles, /--surface-bg:\s*#fff/);
  assert.match(styles, /:root\[data-theme='dark'\]\s*\{[\s\S]*color-scheme:\s*dark/);
  assert.match(styles, /--page-bg:\s*#111827/);
  assert.match(styles, /--surface-bg:\s*#1f2937/);
  assert.match(styles, /\.resume-page\s*\{[\s\S]*color:\s*var\(--text-primary\)/);
  assert.match(styles, /\.resume-page\s*\{[\s\S]*background:\s*var\(--surface-bg\)/);
  assert.match(styles, /h2\s*\{[\s\S]*color:\s*var\(--heading\)/);
  assert.match(styles, /a\s*\{\s*color:\s*var\(--link\)/);
  assert.match(styles, /\.converter-footer\s*\{[\s\S]*color:\s*var\(--text-subtle\)/);
});
