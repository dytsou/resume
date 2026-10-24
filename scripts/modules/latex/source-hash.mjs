/**
 * Content-hash binder for convert dual-lane.
 */

import { createHash } from 'node:crypto';

/**
 * @param {string | Buffer} content
 * @returns {string}
 */
export function hashSourceContent(content) {
  return createHash('sha256').update(content).digest('hex');
}
