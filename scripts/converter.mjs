/**
 * Main conversion logic
 * Orchestrates the LaTeX to HTML conversion process
 */

import { parse } from '@unified-latex/unified-latex-util-parse';
import { unified } from 'unified';
import { unifiedLatexToHast } from '@unified-latex/unified-latex-to-hast';
import { toHtml } from 'hast-util-to-html';

import { extractMetadata } from './utils.mjs';
import { extractMacroMatches } from './latex-parser.mjs';
import { replaceIconMacros } from './html-helpers.mjs';
import {
  processTitleBlock,
  promoteHeadings,
  processAbstract,
  replaceMathPipes,
  processContactHeader,
  processTrioHeadings,
  processQuadDetails,
  mergeDateRanges,
  processTechnicalSkills,
  processQuadHeadings,
  processListMacros,
  processHeadingListMacros,
  cleanupParagraphWrappers,
  applyFinalCleanups,
} from './html-transformers.mjs';
import { wrapInHtmlTemplate } from './html-template.mjs';

/**
 * Converts LaTeX content to styled HTML
 */
export function convertLatexToHtml(latexContent, filename) {
  try {
    // Parse LaTeX to AST
    const ast = parse(latexContent);

    // Convert AST to HAST (HTML AST)
    const hast = unified().use(unifiedLatexToHast).runSync(ast);

    // Generate raw HTML from HAST
    let html = toHtml(hast);

    // Extract metadata
    const metadata = extractMetadata(latexContent);

    // Extract macro matches for processing
    const macros = extractMacroMatches(latexContent);

    // Apply transformations in order
    html = processTitleBlock(html, metadata);
    html = promoteHeadings(html);
    html = processAbstract(html);
    html = replaceMathPipes(html);
    html = processContactHeader(html);
    html = processTrioHeadings(html, macros.trio);
    html = processQuadDetails(html, macros.quadDetails);
    html = mergeDateRanges(html);
    html = processTechnicalSkills(html, macros.sectionType);
    html = processQuadHeadings(html, macros.quadHeading);
    html = processListMacros(html);
    html = processHeadingListMacros(html);
    html = cleanupParagraphWrappers(html);
    html = replaceIconMacros(html);
    html = applyFinalCleanups(html);

    // Wrap in full HTML document
    const styledHtml = wrapInHtmlTemplate(html, metadata);

    return { html: styledHtml, metadata, success: true, error: null };
  } catch (error) {
    return { html: null, metadata: null, success: false, error: error.message };
  }
}
