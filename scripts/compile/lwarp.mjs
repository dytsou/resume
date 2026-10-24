/**
 * lwarp-backed HTML (+ print PDF when available). Directional: shell out only.
 */

import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

/**
 * Inject lwarp package after \documentclass for a worktree copy.
 * @param {string} latex
 * @returns {string}
 */
export function injectLwarpPreamble(latex) {
  if (/\\usepackage(?:\[[^\]]*\])?\{lwarp\}/.test(latex)) {
    return latex;
  }
  return latex.replace(
    /(\\documentclass(?:\[[^\]]*\])?\{[^}]+\})/,
    `$1\n\n\\usepackage[lwarpmk,mathjax]{lwarp}\n`
  );
}

/**
 * @param {{
 *   workDir: string,
 *   sourcePath: string,
 *   run?: typeof spawnSync,
 *   lwarpmkPath?: string,
 * }} options
 * @returns {{ success: boolean, htmlPath?: string, pdfPath?: string, log: string, error?: string }}
 */
export function compileWithLwarp(options) {
  const run = options.run ?? spawnSync;
  const lwarpmk = options.lwarpmkPath ?? 'lwarpmk';
  const { workDir, sourcePath } = options;
  mkdirSync(workDir, { recursive: true });

  const base = basename(sourcePath, '.tex');
  const workTex = join(workDir, `${base}.tex`);
  const source = readFileSync(sourcePath, 'utf8');
  writeFileSync(workTex, injectLwarpPreamble(source));

  // Copy sibling inputs if any (resume may \input local files).
  const sourceDir = dirname(sourcePath);
  for (const sibling of ['glyphtounicode']) {
    const from = join(sourceDir, sibling);
    if (existsSync(from)) {
      copyFileSync(from, join(workDir, sibling));
    }
  }

  const htmlResult = run(lwarpmk, ['html'], {
    cwd: workDir,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  const log = `${htmlResult.stdout ?? ''}\n${htmlResult.stderr ?? ''}`;
  if (htmlResult.status !== 0) {
    return {
      success: false,
      log,
      error: `lwarpmk html exited ${htmlResult.status}`,
    };
  }

  const htmlPath = join(workDir, `${base}.html`);
  if (!existsSync(htmlPath)) {
    return { success: false, log, error: 'lwarp html output missing' };
  }

  let pdfPath;
  const printResult = run(lwarpmk, ['print'], {
    cwd: workDir,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  const printLog = `${log}\n${printResult.stdout ?? ''}\n${printResult.stderr ?? ''}`;
  const candidatePdf = join(workDir, `${base}.pdf`);
  if (printResult.status === 0 && existsSync(candidatePdf)) {
    pdfPath = candidatePdf;
  }

  return {
    success: true,
    htmlPath,
    pdfPath,
    log: printLog,
  };
}
