/**
 * Resume HTML layout framework — CSS + class contract for fuzzy convert output.
 *
 * Use `getResumeFrameworkCss()` inside the HTML template `<style>` block.
 * Class names are documented at the top of `resume-framework.css`.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cssPath = join(dirname(fileURLToPath(import.meta.url)), 'resume-framework.css');

/** @type {string | null} */
let cachedCss = null;

/**
 * @returns {string}
 */
export function getResumeFrameworkCss() {
  if (cachedCss === null) {
    cachedCss = readFileSync(cssPath, 'utf8');
  }
  return cachedCss;
}

/** Stable class names the transformers / template must keep in sync. */
export const RESUME_FRAMEWORK = Object.freeze({
  sheet: 'resume-page',
  contact: 'contact',
  contactName: 'contact-name',
  contactLinks: 'contact-links',
  row: 'row',
  trio: 'trio',
  skillRow: 'skill-row',
  items: 'resume-items',
  footer: 'converter-footer',
});
