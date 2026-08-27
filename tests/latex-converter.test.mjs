import assert from 'node:assert/strict';
import test from 'node:test';

import { convertLatexToHtml } from '../scripts/modules/latex/converter.mjs';

test('converts valid LaTeX input and returns metadata', () => {
  const result = convertLatexToHtml(
    String.raw`\title{Resume}\author{Ada Lovelace}\date{2026}\begin{document}\maketitle\end{document}`,
    'resume'
  );

  assert.equal(result.success, true);
  assert.equal(result.metadata.title, 'Resume');
  assert.match(result.html, /<span class="macro macro-maketitle"><\/span>/);
});
