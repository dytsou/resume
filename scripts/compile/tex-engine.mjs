import { extractMetadata } from '../utils.mjs';
import { compileWithLwarp, cleanWorkDir } from './lwarp.mjs';
import { isTexAvailable } from './tex-available.mjs';
import { validatePreamble } from './validate-preamble.mjs';
import { mkdtempSync } from 'node:fs';
import { basename, join } from 'node:path';
import { tmpdir } from 'node:os';

const BEGIN_DOCUMENT = String.raw`\begin{document}`;
const END_DOCUMENT = String.raw`\end{document}`;

/**
 * @param {string} filename
 * @returns {{ ok: true, filename: string } | { ok: false, error: string }}
 */
export function sanitizeTexFilename(filename) {
  if (typeof filename !== 'string' || !filename.trim()) {
    return { ok: false, error: 'Invalid filename: empty' };
  }
  if (/[/\\]|\.\./.test(filename)) {
    return { ok: false, error: `Invalid filename: ${filename}` };
  }
  const stem = basename(filename).replace(/\.tex$/i, '') || '';
  if (!/^[A-Za-z0-9_-]+$/.test(stem)) {
    return { ok: false, error: `Invalid filename: ${filename}` };
  }
  return { ok: true, filename: `${stem}.tex` };
}

/**
 * @param {string} source
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export function validateLatexSource(source) {
  const trimmed = source?.trim() ?? '';
  if (!trimmed) {
    return { ok: false, error: 'Empty LaTeX source' };
  }
  if (!trimmed.includes(BEGIN_DOCUMENT)) {
    return { ok: false, error: `Missing ${BEGIN_DOCUMENT}` };
  }
  if (!trimmed.includes(END_DOCUMENT)) {
    return { ok: false, error: `Missing ${END_DOCUMENT}` };
  }
  return { ok: true };
}

/**
 * @param {{ source: string, filename: string, id?: string, outputDir?: string }} options
 */
export function compileDocument({ source, filename, id, outputDir }) {
  const sourceOk = validateLatexSource(source);
  if (!sourceOk.ok) {
    return {
      success: false,
      error: sourceOk.error,
      log: sourceOk.error,
    };
  }

  const nameOk = sanitizeTexFilename(filename);
  if (!nameOk.ok) {
    return {
      success: false,
      error: nameOk.error,
      log: nameOk.error,
    };
  }

  const preambleOk = validatePreamble(source);
  if (!preambleOk.ok) {
    return {
      success: false,
      error: preambleOk.error,
      log: preambleOk.error,
    };
  }

  if (!isTexAvailable()) {
    return {
      success: false,
      error:
        'TeX Live not found (need xelatex + lwarpmk). Install TeX Live or run in CI.',
      log: 'TeX unavailable',
    };
  }

  const workDir = mkdtempSync(join(tmpdir(), 'resume-lwarp-'));
  try {
    const result = compileWithLwarp({
      source,
      filename: nameOk.filename,
      workDir,
      outputDir,
    });
    const metadata = extractMetadata(source);
    if (!result.success) {
      return {
        success: false,
        error: result.error,
        log: result.log,
        metadata,
      };
    }
    return {
      success: true,
      html: result.html,
      pdfPath: result.pdfPath,
      metadata,
      error: null,
      log: result.log,
    };
  } finally {
    cleanWorkDir(workDir);
  }
}

/** @deprecated Use compileDocument */
export function compileLatexToHtml(source, filename) {
  return compileDocument({ source, filename });
}
