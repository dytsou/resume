import assert from 'node:assert/strict';
import test from 'node:test';

import {
  extractMacroMatches,
  parseLatexMacro,
} from '../scripts/modules/latex/parser.mjs';

test('parses nested macro arguments and ignores incomplete macros', () => {
  assert.deepEqual(
    parseLatexMacro(
      String.raw`\resumeTrioHeading{Project {Alpha}}{TypeScript}{Link}`,
      'resumeTrioHeading',
      3
    ),
    [
      [
        String.raw`\resumeTrioHeading{Project {Alpha}}{TypeScript}{Link}`,
        'Project {Alpha}',
        'TypeScript',
        'Link',
      ],
    ]
  );
  assert.deepEqual(
    parseLatexMacro(
      String.raw`\resumeTrioHeading{Only one}`,
      'resumeTrioHeading',
      3
    ),
    []
  );
});

test('extracts all supported resume macro groups', () => {
  const matches = extractMacroMatches(
    String.raw`\resumeSectionType{Languages}{:}{English}\resumeQuadHeading{A}{B}{C}{D}`
  );

  assert.equal(matches.sectionType[0][1], 'Languages');
  assert.equal(matches.sectionType[0][3], 'English');
  assert.equal(matches.quadHeading[0][4], 'D');
});
