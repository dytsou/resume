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

test('injects SEO meta tags from seo object', () => {
  const result = createStaticIndex(
    '<html><head><!-- SEO_TITLE --><!-- SEO_DESCRIPTION --><!-- SEO_CANONICAL --><!-- SEO_OG_TITLE --><!-- SEO_OG_DESCRIPTION --><!-- SEO_OG_TYPE --><!-- SEO_OG_URL --></head><body></body></html>',
    '<html><head></head><body></body></html>',
    '',
    {
      title: 'John Doe — Resume',
      description: 'Resume of John Doe',
      canonicalUrl: 'https://example.com/resume/',
      ogTitle: 'John Doe — Resume',
      ogDescription: 'Resume of John Doe',
      ogType: 'profile',
      ogUrl: 'https://example.com/resume/',
    }
  );

  assert.match(result, /<title>John Doe — Resume<\/title>/);
  assert.match(result, /<meta name="description" content="Resume of John Doe" \/>/);
  assert.match(result, /<link rel="canonical" href="https:\/\/example\.com\/resume\/" \/>/);
  assert.match(result, /<meta property="og:title" content="John Doe — Resume" \/>/);
  assert.match(result, /<meta property="og:type" content="profile" \/>/);
  assert.match(result, /<meta property="og:url" content="https:\/\/example\.com\/resume\/" \/>/);
});

test('omits canonical tag when canonicalUrl is empty', () => {
  const result = createStaticIndex(
    '<html><head><!-- SEO_CANONICAL --></head><body></body></html>',
    '<html><head></head><body></body></html>',
    '',
    { canonicalUrl: '' }
  );

  assert.match(result, /^<html>.*<\/html>$/);
  assert.ok(!result.includes('<link rel="canonical"'));
});
