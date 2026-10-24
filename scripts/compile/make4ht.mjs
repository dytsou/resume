/**
 * make4ht HTML fallback + latexmk XeLaTeX PDF.
 */

import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

import { texSpawnEnv } from './tex-tools.mjs';

function spawnLog(result) {
  return [result.error?.message, result.stdout, result.stderr].filter(Boolean).join('\n');
}

/**
 * @param {{
 *   workDir: string,
 *   sourcePath: string,
 *   run?: typeof spawnSync,
 *   make4htPath?: string,
 *   latexmkPath?: string,
 * }} options
 * @returns {{ success: boolean, htmlPath?: string, pdfPath?: string, log: string, error?: string }}
 */
export function compileWithMake4ht(options) {
  const run = options.run ?? spawnSync;
  const make4htBin = options.make4htPath ?? 'make4ht';
  const latexmkBin = options.latexmkPath ?? 'latexmk';
  const { workDir, sourcePath } = options;
  mkdirSync(workDir, { recursive: true });

  const base = basename(sourcePath, '.tex');
  const workTex = join(workDir, `${base}.tex`);
  writeFileSync(workTex, readFileSync(sourcePath, 'utf8'));

  const sourceDir = dirname(sourcePath);
  for (const sibling of ['glyphtounicode']) {
    const from = join(sourceDir, sibling);
    if (existsSync(from)) {
      copyFileSync(from, join(workDir, sibling));
    }
  }

  // -x selects XeLaTeX; do not pass "xelatex" as a positional (make4ht treats it as the input file).
  const htmlResult = run(make4htBin, ['-x', `${base}.tex`], {
    cwd: workDir,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
    env: texSpawnEnv(make4htBin),
  });
  let log = spawnLog(htmlResult);
  if (htmlResult.status !== 0) {
    return {
      success: false,
      log,
      error: `make4ht exited ${htmlResult.status}`,
    };
  }

  const htmlPath = join(workDir, `${base}.html`);
  if (!existsSync(htmlPath)) {
    return { success: false, log, error: 'make4ht html output missing' };
  }

  const pdfResult = run(latexmkBin, ['-xelatex', '-interaction=nonstopmode', `${base}.tex`], {
    cwd: workDir,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
    env: texSpawnEnv(latexmkBin),
  });
  log = `${log}\n${spawnLog(pdfResult)}`;
  const pdfPath = join(workDir, `${base}.pdf`);
  if (pdfResult.status !== 0 || !existsSync(pdfPath)) {
    return {
      success: false,
      htmlPath,
      log,
      error: 'latexmk xelatex pdf failed or missing',
    };
  }

  return { success: true, htmlPath, pdfPath, log };
}
