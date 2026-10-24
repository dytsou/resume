/**
 * Minimal automated fidelity checks for certified HTML/PDF.
 */

/**
 * @param {string} html
 * @param {{ titleHints?: string[] }} [options]
 * @returns {{ ok: boolean, reason?: string }}
 */
export function assertHtmlLandmarks(html, options = {}) {
  if (typeof html !== 'string' || html.trim().length < 32) {
    return { ok: false, reason: 'html_empty_or_too_short' };
  }
  const titleHints = options.titleHints ?? ['resume', 'curriculum', 'experience', 'education'];
  const lowered = html.toLowerCase();
  const hasTitleTag = /<title\b[^>]*>\s*[^<]+/i.test(html);
  const hasHeading = /<h[1-3]\b/i.test(html);
  const hasHint = titleHints.some((hint) => lowered.includes(hint));
  if (!hasTitleTag && !hasHeading && !hasHint) {
    return { ok: false, reason: 'html_missing_title_or_section_landmarks' };
  }
  return { ok: true };
}

/**
 * @param {Uint8Array | Buffer | null | undefined} bytes
 * @returns {{ ok: boolean, reason?: string }}
 */
export function assertPdfNonEmpty(bytes) {
  if (!bytes || bytes.length === 0) {
    return { ok: false, reason: 'pdf_empty' };
  }
  const head = Buffer.from(bytes.subarray(0, 5)).toString('latin1');
  if (!head.startsWith('%PDF')) {
    return { ok: false, reason: 'pdf_not_pdf_header' };
  }
  return { ok: true };
}
