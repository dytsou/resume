import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { injectLwarpPreamble } from '../scripts/compile/lwarp.mjs';
import { compileCertifiedResume } from '../scripts/compile/tex-engine.mjs';
import { detectTexTools } from '../scripts/compile/tex-tools.mjs';

const sampleTex = String.raw`\documentclass{article}
\usepackage{titlesec}
\begin{document}
\title{Resume}
\section{Experience}
Hello
\end{document}
`;

function writeTempSource(content = sampleTex) {
  const dir = mkdtempSync(join(tmpdir(), 'resume-src-'));
  const path = join(dir, 'resume.tex');
  writeFileSync(path, content);
  return { dir, path };
}

test('injectLwarpPreamble inserts lwarp after documentclass once', () => {
  const once = injectLwarpPreamble(sampleTex);
  assert.match(once, /\\usepackage\[lwarpmk,mathjax\]\{lwarp\}/);
  const twice = injectLwarpPreamble(once);
  assert.equal(
    (twice.match(/\\usepackage\[lwarpmk,mathjax\]\{lwarp\}/g) ?? []).length,
    1
  );
});

test('out-of-budget package fails before shelling out', () => {
  const { dir, path } = writeTempSource(
    String.raw`\documentclass{article}
\usepackage{totallyunknown}
\begin{document}\end{document}`
  );
  const out = mkdtempSync(join(tmpdir(), 'resume-out-'));
  try {
    const result = compileCertifiedResume({
      sourcePath: path,
      outputDir: out,
      tools: { texAvailable: true, lwarp: true, make4ht: false, latexmk: true, xelatex: true },
      compileLwarp: () => {
        throw new Error('should not run');
      },
    });
    assert.equal(result.success, false);
    assert.equal(result.diagnostics[0].package, 'totallyunknown');
  } finally {
    rmSync(dir, { recursive: true, force: true });
    rmSync(out, { recursive: true, force: true });
  }
});

test('fatal TeX error returns structured failure without certified claim', () => {
  const { dir, path } = writeTempSource();
  const out = mkdtempSync(join(tmpdir(), 'resume-out-'));
  try {
    const result = compileCertifiedResume({
      sourcePath: path,
      outputDir: out,
      tools: { texAvailable: true, lwarp: true, make4ht: false, latexmk: true, xelatex: true },
      compileLwarp: () => ({
        success: false,
        log: 'fatal error',
        error: 'lwarpmk html exited 1',
      }),
    });
    assert.equal(result.success, false);
    assert.equal(result.lane, 'certified');
    assert.equal(result.htmlPath, null);
    assert.match(result.diagnosticsJson, /tex_compile_failed/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
    rmSync(out, { recursive: true, force: true });
  }
});

test('adapter refuses success when PDF is zero bytes', () => {
  const { dir, path } = writeTempSource();
  const work = mkdtempSync(join(tmpdir(), 'resume-work-'));
  const out = mkdtempSync(join(tmpdir(), 'resume-out-'));
  const htmlPath = join(work, 'resume.html');
  const pdfPath = join(work, 'resume.pdf');
  writeFileSync(
    htmlPath,
    '<html><head><title>Resume</title></head><body><h1>Experience</h1></body></html>'
  );
  writeFileSync(pdfPath, '');
  try {
    const result = compileCertifiedResume({
      sourcePath: path,
      outputDir: out,
      tools: { texAvailable: true, lwarp: true, make4ht: false, latexmk: true, xelatex: true },
      compileLwarp: () => ({
        success: true,
        htmlPath,
        pdfPath,
        log: 'ok',
      }),
    });
    assert.equal(result.success, false);
    assert.match(result.diagnosticsJson, /pdf_empty|pdf_not_pdf_header/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
    rmSync(work, { recursive: true, force: true });
    rmSync(out, { recursive: true, force: true });
  }
});

test('happy path mock writes HTML and PDF under outputDir', () => {
  const { dir, path } = writeTempSource();
  const work = mkdtempSync(join(tmpdir(), 'resume-work-'));
  const out = mkdtempSync(join(tmpdir(), 'resume-out-'));
  mkdirSync(work, { recursive: true });
  const htmlPath = join(work, 'resume.html');
  const pdfPath = join(work, 'resume.pdf');
  writeFileSync(
    htmlPath,
    '<html><head><title>Resume</title></head><body><h1>Experience</h1></body></html>'
  );
  writeFileSync(pdfPath, '%PDF-1.5\n%%EOF\n');
  try {
    const result = compileCertifiedResume({
      sourcePath: path,
      outputDir: out,
      tools: { texAvailable: true, lwarp: true, make4ht: false, latexmk: true, xelatex: true },
      compileLwarp: () => ({
        success: true,
        htmlPath,
        pdfPath,
        log: 'ok',
      }),
    });
    assert.equal(result.success, true);
    assert.equal(result.tool, 'lwarp');
    assert.equal(result.lane, 'certified');
    assert.ok(readFileSync(result.htmlPath, 'utf8').includes('Experience'));
    assert.ok(readFileSync(result.pdfPath).length > 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
    rmSync(work, { recursive: true, force: true });
    rmSync(out, { recursive: true, force: true });
  }
});

test('live TeX resume convert when tools are installed', { skip: !detectTexTools().texAvailable }, () => {
  const out = mkdtempSync(join(tmpdir(), 'resume-live-'));
  try {
    const result = compileCertifiedResume({
      sourcePath: join('latex', 'resume.tex'),
      outputDir: out,
    });
    assert.equal(result.success, true, result.error ?? result.log);
    assert.ok(result.htmlPath);
    assert.ok(result.pdfPath);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});
