/**
 * Utility functions for file operations and metadata extraction
 */

import { existsSync, mkdirSync } from 'fs';

/**
 * Ensures a directory exists, creating it recursively if needed
 */
export function ensureDirectoryExists(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

/**
 * Extracts metadata from LaTeX document
 */
export function extractMetadata(latexContent) {
  const titleMatch = latexContent.match(/\\title\{([^}]+)\}/);
  const authorMatch = latexContent.match(/\\author\{([^}]+)\}/);
  const dateMatch = latexContent.match(/\\date\{([^}]+)\}/);

  return {
    title: titleMatch ? titleMatch[1] : 'Untitled Document',
    author: authorMatch ? authorMatch[1] : 'Unknown Author',
    date: dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0],
  };
}
