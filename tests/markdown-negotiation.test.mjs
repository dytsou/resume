import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  estimateTokens,
  extractMeta,
  buildFrontmatter,
  convertToMarkdown,
} from '../worker/markdown.mjs';

const SAMPLE_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="description" content="Resume of Dong-You Tsou, including software engineering experience at LINE Taiwan Limited, research at NYCU labs, and selected projects." />
  <meta property="og:title" content="Dong-You Tsou — Resume" />
  <meta property="og:description" content="Fallback description" />
  <meta property="og:image" content="https://dy.tsou.me/resume/cover.png" />
  <title>Dong-You Tsou — Resume</title>
</head>
<body>
  <div id="resume-content">
    <h1>Dong-You Tsou</h1>
    <h2>Experience</h2>
    <ul>
      <li>Software Engineer at LINE Taiwan Limited</li>
      <li>Researcher at NYCU labs</li>
    </ul>
    <p>Selected projects and open source work.</p>
  </div>
</body>
</html>`;

test('extractMeta prefers standard meta name over og fallback', () => {
  const meta = extractMeta(SAMPLE_HTML);
  assert.equal(meta.title, 'Dong-You Tsou — Resume');
  assert.equal(
    meta.description,
    'Resume of Dong-You Tsou, including software engineering experience at LINE Taiwan Limited, research at NYCU labs, and selected projects.'
  );
  assert.equal(meta.image, 'https://dy.tsou.me/resume/cover.png');
});

test('buildFrontmatter emits only present fields', () => {
  assert.equal(buildFrontmatter({}), '');
  const fm = buildFrontmatter({ title: 'Hello: World' });
  assert.match(fm, /^---\ntitle: "Hello: World"\n---/);
});

test('convertToMarkdown produces markdown with frontmatter and body', async () => {
  const { markdown, frontmatter } = await convertToMarkdown(SAMPLE_HTML);
  assert.ok(frontmatter.includes('title: Dong-You Tsou — Resume'));
  assert.ok(markdown.startsWith('---\n'));
  assert.match(markdown, /# Dong-You Tsou/);
  assert.match(markdown, /## Experience/);
  assert.match(markdown, /- Software Engineer at LINE Taiwan Limited/);
  assert.doesNotMatch(markdown, /<h1>/);
});

test('estimateTokens scales with length', () => {
  assert.equal(estimateTokens(''), 0);
  assert.ok(estimateTokens('a'.repeat(400)) >= estimateTokens('a'.repeat(40)));
});
