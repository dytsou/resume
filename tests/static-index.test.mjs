import assert from 'node:assert/strict';
import test from 'node:test';

import { createStaticIndex } from '../scripts/shared/static-index.mjs';

test('injects generated resume content and styles into the static page', () => {
  const result = createStaticIndex(
    '<html><head><!-- RESUME_STYLES --></head><body><main><!-- RESUME_CONTENT --></main><!-- DOWNLOAD_BUTTON --></body></html>',
    '<html><head><style>.resume-page { color: red; }</style></head><body><article>Resume</article></body></html>',
    'https://drive.google.com/file/d/resume/view'
  );

  assert.match(result, /https:\/\/drive\.google\.com\/uc\?export=download&amp;id=resume/);
  assert.match(result, /<style>\.resume-page \{ color: red; \}<\/style>/);
  assert.match(result, /<article>Resume<\/article>/);
  assert.match(result, /download="resume\.pdf"/);
});

test('preserves script assets with attributes on the closing tag', () => {
  const result = createStaticIndex(
    '<html><head><!-- RESUME_ASSETS --></head><body></body></html>',
    '<html><head><script src="/mathjax.js"></script ></head><body></body></html>'
  );

  assert.match(result, /<script src="\/mathjax\.js"><\/script >/);
});
