import assert from 'node:assert/strict';
import test from 'node:test';

import {
  convertToDirectDownloadLink,
  downloadFile,
  extractGoogleDriveFileId,
} from '../src/utils/googleDriveUtils.ts';

test('extracts a file ID from a Drive file URL', () => {
  assert.equal(
    extractGoogleDriveFileId(
      'https://drive.google.com/file/d/abc_123-xyz/view?usp=sharing'
    ),
    'abc_123-xyz'
  );
});

test('extracts a file ID from a Drive query parameter', () => {
  assert.equal(
    extractGoogleDriveFileId(
      'https://drive.google.com/open?foo=bar&id=abc_123-xyz'
    ),
    'abc_123-xyz'
  );
});

test('accepts a direct file ID and trims surrounding whitespace', () => {
  assert.equal(extractGoogleDriveFileId('  abc_123-xyz  '), 'abc_123-xyz');
});

test('returns null for an unsupported link', () => {
  assert.equal(extractGoogleDriveFileId('https://example.com/file'), null);
  assert.equal(extractGoogleDriveFileId(''), null);
});

test('converts a Drive link to a direct download URL', () => {
  assert.equal(
    convertToDirectDownloadLink(
      'https://drive.google.com/file/d/abc_123-xyz/view'
    ),
    'https://drive.google.com/uc?export=download&id=abc_123-xyz'
  );
  assert.equal(convertToDirectDownloadLink('not a Drive link'), null);
});

test('creates, clicks, and removes the temporary download link', () => {
  const appended = [];
  let clicked = false;
  let removed = false;

  globalThis.document = {
    createElement: (tagName) => {
      assert.equal(tagName, 'a');
      return {
        click: () => {
          clicked = true;
        },
        remove: () => {
          removed = true;
        },
      };
    },
    body: {
      appendChild: (link) => appended.push(link),
    },
  };

  downloadFile('https://example.com/file', 'resume.pdf');

  assert.equal(appended.length, 1);
  assert.equal(appended[0].href, 'https://example.com/file');
  assert.equal(appended[0].download, 'resume.pdf');
  assert.equal(appended[0].target, '_blank');
  assert.equal(clicked, true);
  assert.equal(removed, true);
});
