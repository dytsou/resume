/**
 * HTML transformation helper functions
 */

import { ICON_MAP } from './config.mjs';

/**
 * Replaces FontAwesome icon macros with proper HTML elements
 */
export function replaceIconMacros(html) {
  return html.replace(
    /<span class="macro macro-(fa\w+)"><\/span>/g,
    (_, macro) => {
      const cls = ICON_MAP[macro] || 'fas fa-circle';
      return `<i class="${cls}"></i>`;
    }
  );
}

/**
 * Cleans up text by removing line breaks and normalizing spaces
 */
export function cleanText(text) {
  return text
    .replace(/<br class="linebreak">/g, ' ')
    .replace(
      /<span class="inline-math">\|<\/span>/g,
      '<span class="sep">·</span>'
    )
    .replace(/class="href"/g, '')
    .trim();
}

/**
 * Extracts URL and display text from LaTeX \href command
 */
export function parseHrefCommand(hrefString) {
  const match = hrefString.match(/\\href\{([^}]+)\}\{([^}]+)\}/);
  if (!match) return null;

  const [, url, text] = match;
  const cleanedText = text
    .replace(/\\uline\{([^}]+)\}/g, '$1')
    .replace(/\\uline\{([^}]*)$/g, '$1');

  return { url, text: cleanedText };
}

/**
 * Converts href command to HTML anchor element
 */
export function hrefToAnchor(hrefString, makeBold = false) {
  if (!hrefString.includes('\\href{')) {
    return makeBold ? `<strong>${hrefString}</strong>` : hrefString;
  }

  const parsed = parseHrefCommand(hrefString);
  if (!parsed) {
    return makeBold ? `<strong>${hrefString}</strong>` : hrefString;
  }

  const content = makeBold ? `<strong>${parsed.text}</strong>` : parsed.text;
  return `<a href="${parsed.url}" target="_blank" rel="noopener noreferrer">${content}</a>`;
}
