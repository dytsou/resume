import assert from 'node:assert/strict';
import test from 'node:test';

import { extractMetadata } from '../scripts/shared/utils.mjs';

test('extracts document metadata from LaTeX commands', () => {
  assert.deepEqual(
    extractMetadata('\\title{Resume}\\author{Ada Lovelace}\\date{2026-08-27}'),
    {
      title: 'Resume',
      author: 'Ada Lovelace',
      date: '2026-08-27',
    }
  );
});
