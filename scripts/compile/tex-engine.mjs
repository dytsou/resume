/**
 * TeX compile abstraction — batch convert and dev preview share this module.
 * U1: delegates to unified-latex until lwarp lands in U2/U3.
 */

import { convertLatexToHtml } from '../converter.mjs';

/**
 * @param {string} source
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
function validateLatexSource(source) {
  const trimmed = source?.trim() ?? '';
  if (!trimmed) {
    return { ok: false, error: 'Empty LaTeX source' };
  }
  if (!trimmed.includes('\\begin{document}')) {
    return { ok: false, error: 'Missing \\begin{document}' };
  }
  if (!trimmed.includes('\\end{document}')) {
    return { ok: false, error: 'Missing \\end{document}' };
  }
  return { ok: true };
}

/**
 * @param {{ source: string, filename: string, id?: string, engine?: string }} options
 * @returns {{ success: boolean, html?: string, pdfPath?: string, metadata?: object, error?: string, log?: string }}
 */
export function compileDocument({ source, filename }) {
  const validation = validateLatexSource(source);
  if (!validation.ok) {
    return {
      success: false,
      error: validation.error,
      log: validation.error,
    };
  }

  const result = convertLatexToHtml(source, filename);

  if (!result.success) {
    return {
      success: false,
      error: result.error ?? 'Conversion failed',
      log: result.error ?? '',
    };
  }

  return {
    success: true,
    html: result.html,
    metadata: result.metadata,
    error: null,
    log: '',
  };
}

/** @deprecated Use compileDocument */
export function compileLatexToHtml(source, filename) {
  return compileDocument({ source, filename });
}
