import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  canReuseCertifiedArtifacts,
  convertAll,
  shouldPreserveCertifiedArtifacts,
} from '../scripts/commands/convert-latex.mjs';
import { hashSourceContent } from '../scripts/modules/latex/source-hash.mjs';

const resumeBody = String.raw`\documentclass{article}
\usepackage{titlesec}
\title{Resume}
\author{Ada}
\date{2026}
\begin{document}\maketitle\section{Experience}Hi\end{document}
`;

function makeWorkspace() {
  const root = mkdtempSync(join(tmpdir(), 'dual-lane-'));
  const latexDir = join(root, 'latex');
  const outputDir = join(root, 'public', 'converted-docs');
  const manifestFile = join(root, 'public', 'documents-manifest.json');
  mkdirSync(latexDir, { recursive: true });
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(join(latexDir, 'resume.tex'), resumeBody);
  return { root, latexDir, outputDir, manifestFile };
}

test('TeX path writes HTML+PDF and manifest lane=certified with matching sourceHash', () => {
  const { root, latexDir, outputDir, manifestFile } = makeWorkspace();
  try {
    const result = convertAll({
      latexDir,
      outputDir,
      manifestFile,
      tools: { texAvailable: true, make4ht: true, latexmk: true, xelatex: true },
      compileCertified: ({ outputDir: out, basename }) => {
        writeFileSync(
          join(out, `${basename}.html`),
          '<html><head><title>Resume</title></head><body><h1>Experience</h1></body></html>'
        );
        writeFileSync(join(out, `${basename}.pdf`), '%PDF-1.5\n%%EOF\n');
        return {
          success: true,
          tool: 'make4ht',
          htmlPath: join(out, `${basename}.html`),
          pdfPath: join(out, `${basename}.pdf`),
        };
      },
      convertFuzzy: () => ({
        success: true,
        html: '<html>fuzzy</html>',
        metadata: { title: 'Resume', author: 'Ada', date: '2026' },
        error: null,
      }),
    });
    assert.equal(result.ok, true);
    assert.equal(result.manifest[0].lane, 'certified');
    assert.equal(result.manifest[0].sourceHash, hashSourceContent(resumeBody));
    assert.ok(existsPdf(outputDir));
    assert.match(
      readFileSync(join(outputDir, 'resume.html'), 'utf8'),
      /fuzzy/
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('TeX-less with matching prebuilt certified artifacts skips fuzzy overwrite', () => {
  const { root, latexDir, outputDir, manifestFile } = makeWorkspace();
  const sourceHash = hashSourceContent(resumeBody);
  writeFileSync(join(outputDir, 'resume.html'), '<html>certified</html>');
  writeFileSync(join(outputDir, 'resume.pdf'), '%PDF-1.5\n%%EOF\n');
  writeFileSync(
    manifestFile,
    JSON.stringify([
      {
        id: 'resume',
        filename: 'resume.tex',
        title: 'Resume',
        author: 'Ada',
        date: '2026',
        htmlPath: 'converted-docs/resume.html',
        pdfPath: 'converted-docs/resume.pdf',
        lane: 'certified',
        sourceHash,
      },
    ])
  );
  let fuzzyCalls = 0;
  try {
    const result = convertAll({
      latexDir,
      outputDir,
      manifestFile,
      tools: { texAvailable: false, make4ht: false, latexmk: false, xelatex: false },
      convertFuzzy: () => {
        fuzzyCalls += 1;
        return {
          success: true,
          html: '<html>fuzzy-overwrite</html>',
          metadata: { title: 'Resume', author: 'Ada', date: '2026' },
          error: null,
        };
      },
    });
    assert.equal(result.ok, true);
    assert.equal(result.manifest[0].lane, 'certified');
    assert.equal(fuzzyCalls, 0);
    assert.equal(readFileSync(join(outputDir, 'resume.html'), 'utf8'), '<html>certified</html>');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('TeX-less without matching prebuilts produces fuzzy HTML and does not invent certified lane', () => {
  const { root, latexDir, outputDir, manifestFile } = makeWorkspace();
  try {
    const result = convertAll({
      latexDir,
      outputDir,
      manifestFile,
      tools: { texAvailable: false, make4ht: false, latexmk: false, xelatex: false },
      convertFuzzy: () => ({
        success: true,
        html: '<html>fuzzy-only</html>',
        metadata: { title: 'Resume', author: 'Ada', date: '2026' },
        error: null,
      }),
    });
    assert.equal(result.ok, true);
    assert.equal(result.manifest[0].lane, 'fuzzy');
    assert.equal(result.manifest[0].pdfPath, undefined);
    assert.match(readFileSync(join(outputDir, 'resume.html'), 'utf8'), /fuzzy-only/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('fuzzy run refuses to replace certified PDF when sourceHash still matches', () => {
  const { root, outputDir } = makeWorkspace();
  const sourceHash = hashSourceContent(resumeBody);
  writeFileSync(join(outputDir, 'resume.pdf'), '%PDF-1.5\ncertified\n');
  const prior = {
    id: 'resume',
    lane: 'certified',
    sourceHash,
  };
  assert.equal(
    shouldPreserveCertifiedArtifacts(outputDir, 'resume', sourceHash, prior),
    true
  );
  assert.equal(
    canReuseCertifiedArtifacts(outputDir, 'resume', sourceHash, prior),
    false
  );
  rmSync(root, { recursive: true, force: true });
});

function existsPdf(outputDir) {
  return readFileSync(join(outputDir, 'resume.pdf')).length > 0;
}
