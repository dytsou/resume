import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applyFinalCleanups,
  mergeDateRanges,
  processHeadingListMacros,
  processListMacros,
  promoteHeadings,
} from '../scripts/modules/html/transformers.mjs';

test('promotes headings and converts custom list markers', () => {
  assert.equal(
    promoteHeadings('<h4>Education</h4><h3>Experience</h3>'),
    '<h2>Education</h2><h2>Experience</h2>'
  );
  assert.equal(
    processListMacros(
      '<p><span class="macro macro-resumeItemListStart"></span>First<span class="macro macro-resumeItem"></span>Second<span class="macro macro-resumeItemListEnd"></span></p>'
    ),
    '<p><ul class="resume-items"><li>First</li><li>Second</li></ul></p>'
  );
});

test('converts heading list markers and merges open-ended date ranges', () => {
  assert.equal(
    processHeadingListMacros(
      '<span class="macro macro-resumeHeadingListStart"></span>Skills<span class="macro macro-resumeHeadingListEnd"></span>'
    ),
    '<div class="resume-heading-list">Skills</div>'
  );
  assert.match(
    mergeDateRanges(
      '<div class="quad-details"><span class="date">2024 –</span><div class="left"><em>Engineer</em></div><span>Present</span></div>'
    ),
    /2024 – Present/
  );
});

test('removes duplicate external-link attributes during final cleanup', () => {
  assert.equal(
    applyFinalCleanups(
      '<a href="https://example.com" target="_blank" rel="noopener noreferrer">Link</a>'
    ),
    '<a href="https://example.com" target="_blank" rel="noopener noreferrer">Link</a>'
  );
});
