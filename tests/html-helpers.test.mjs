import assert from 'node:assert/strict';
import test from 'node:test';

import {
  cleanText,
  hrefToAnchor,
  parseHrefCommand,
  replaceIconMacros,
} from '../scripts/modules/html/helpers.mjs';

test('converts icon macros and cleans generated text', () => {
  assert.equal(
    replaceIconMacros(
      '<span class="macro macro-faGithub"></span><span class="macro macro-faUnknown"></span>'
    ),
    '<i class="fab fa-github"></i><i class="fas fa-circle"></i>'
  );
  assert.equal(
    cleanText(
      '<span class="inline-math">|</span>  Alice<br class="linebreak"> class="href"'
    ),
    '<span class="sep">·</span>  Alice'
  );
});

test('parses href commands and renders safe external anchors', () => {
  assert.deepEqual(
    parseHrefCommand(String.raw`\href{https://example.com}{\uline{Project}}`),
    { url: 'https://example.com', text: 'Project' }
  );
  assert.equal(
    hrefToAnchor(String.raw`\href{https://example.com}{Project}`, true),
    '<a href="https://example.com" target="_blank" rel="noopener noreferrer"><strong>Project</strong></a>'
  );
  assert.equal(hrefToAnchor('Plain text', true), '<strong>Plain text</strong>');
});
