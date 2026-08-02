import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { basename, join } from 'node:path';

import { postprocessHtml } from './postprocess-html.mjs';

/**
 * @param {string} filename
 * @returns {string} basename without .tex
 */
function safeTexBasename(filename) {
  if (/[/\\]|\.\./.test(filename)) {
    throw new Error(`Invalid filename: ${filename}`);
  }
  const stem = basename(filename).replace(/\.tex$/i, '') || 'document';
  if (!/^[A-Za-z0-9_-]+$/.test(stem)) {
    throw new Error(`Invalid filename: ${filename}`);
  }
  return stem;
}

/**
 * @param {string} cmd
 * @param {string[]} args
 * @param {{ cwd: string, env?: Record<string, string> }} opts
 */
function run(cmd, args, opts) {
  const result = spawnSync(cmd, args, {
    cwd: opts.cwd,
    env: { ...process.env, ...opts.env },
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
  const log = [result.stdout, result.stderr].filter(Boolean).join('\n');
  if (result.status !== 0) {
    const err = new Error(`${cmd} ${args.join(' ')} failed (exit ${result.status})`);
    err.log = log;
    throw err;
  }
  return log;
}

/**
 * @param {string} workDir
 * @param {string} texBasename
 */
function findHtmlOutput(workDir, texBasename) {
  const candidates = [
    join(workDir, `${texBasename}.html`),
    join(workDir, `${texBasename}_html.html`),
  ];
  for (const path of candidates) {
    if (existsSync(path)) return path;
  }
  const htmlFiles = readdirSync(workDir).filter((f) => f.endsWith('.html'));
  if (htmlFiles.length === 1) {
    return join(workDir, htmlFiles[0]);
  }
  throw new Error(`No HTML output found in ${workDir}`);
}

/**
 * @param {string} workDir
 * @param {string} texBasename
 */
function findPdfOutput(workDir, texBasename) {
  const candidates = [
    join(workDir, `${texBasename}.pdf`),
    join(workDir, `${texBasename}_html.pdf`),
  ];
  for (const path of candidates) {
    if (existsSync(path)) return path;
  }
  const pdfs = readdirSync(workDir).filter((f) => f.endsWith('.pdf'));
  if (pdfs.length >= 1) {
    return join(workDir, pdfs[0]);
  }
  throw new Error(`No PDF output found in ${workDir}`);
}

/**
 * Copy lwarp sidecar CSS next to HTML in outputDir when present.
 * @param {string} workDir
 * @param {string} outputDir
 */
function copyLwarpAssets(workDir, outputDir) {
  mkdirSync(outputDir, { recursive: true });
  for (const file of readdirSync(workDir)) {
    if (file.endsWith('.css') || file.endsWith('.png') || file.endsWith('.svg')) {
      copyFileSync(join(workDir, file), join(outputDir, file));
    }
  }
}

/**
 * @param {{
 *   source: string,
 *   filename: string,
 *   workDir: string,
 *   outputDir?: string,
 * }} options
 */
export function compileWithLwarp({ source, filename, workDir, outputDir }) {
  mkdirSync(workDir, { recursive: true });
  const texBasename = safeTexBasename(filename);
  const texFile = `${texBasename}.tex`;
  const texPath = join(workDir, texFile);
  writeFileSync(texPath, source, 'utf8');

  let log = '';
  try {
    log += run('xelatex', ['-interaction=nonstopmode', '-halt-on-error', texFile], {
      cwd: workDir,
    });
    log += run('xelatex', ['-interaction=nonstopmode', '-halt-on-error', texFile], {
      cwd: workDir,
    });
    log += run('lwarpmk', ['html'], { cwd: workDir });
    log += run('lwarpmk', ['print'], { cwd: workDir });

    const htmlPath = findHtmlOutput(workDir, texBasename);
    const pdfPath = findPdfOutput(workDir, texBasename);
    let html = postprocessHtml(readFileSync(htmlPath, 'utf8'));

    if (outputDir) {
      mkdirSync(outputDir, { recursive: true });
      copyLwarpAssets(workDir, outputDir);
      const outHtml = join(outputDir, `${texBasename}.html`);
      writeFileSync(outHtml, html, 'utf8');
      copyFileSync(pdfPath, join(outputDir, `${texBasename}.pdf`));
      html = readFileSync(outHtml, 'utf8');
    }

    return {
      success: true,
      html,
      pdfPath: join(outputDir ?? workDir, `${texBasename}.pdf`),
      log,
      error: null,
    };
  } catch (e) {
    return {
      success: false,
      html: null,
      pdfPath: null,
      log: `${log}\n${e.log ?? e.message}`,
      error: e.message,
    };
  }
}

/** Clean ephemeral lwarp aux in workDir */
export function cleanWorkDir(workDir) {
  if (existsSync(workDir)) {
    rmSync(workDir, { recursive: true, force: true });
  }
}

/** @returns {boolean} */
export function pdfNonEmpty(pdfPath) {
  if (!existsSync(pdfPath)) return false;
  const buf = readFileSync(pdfPath);
  return buf.length > 1000 && buf.subarray(0, 4).toString() === '%PDF';
}
