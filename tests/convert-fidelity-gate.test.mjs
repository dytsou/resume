import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assertHtmlLandmarks,
  assertPdfNonEmpty,
} from '../scripts/compile/fidelity.mjs';

test('fidelity helper accepts non-empty HTML with title/section landmarks', () => {
  const result = assertHtmlLandmarks(
    '<html><head><title>My Resume</title></head><body><h1>Experience</h1></body></html>'
  );
  assert.equal(result.ok, true);
});

test('empty HTML fails the gate helper', () => {
  assert.equal(assertHtmlLandmarks('').ok, false);
  assert.equal(assertHtmlLandmarks('   short   ').ok, false);
});

test('zero-byte PDF fails the gate helper', () => {
  assert.equal(assertPdfNonEmpty(Buffer.alloc(0)).ok, false);
  assert.equal(assertPdfNonEmpty(null).ok, false);
});

test('PDF with %PDF header passes non-empty check', () => {
  assert.equal(assertPdfNonEmpty(Buffer.from('%PDF-1.5\n%%EOF\n')).ok, true);
});
