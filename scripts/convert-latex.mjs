/**
 * LaTeX to HTML Converter
 *
 * Converts LaTeX resume documents to styled HTML pages.
 * Handles custom resume macros, FontAwesome icons, and responsive layouts.
 */

import {
  readFileSync,
  writeFileSync,
  readdirSync,
  existsSync,
  mkdirSync,
} from 'fs';
import { join, basename, extname } from 'path';
import { parse } from '@unified-latex/unified-latex-util-parse';
import { unified } from 'unified';
import { unifiedLatexToHast } from '@unified-latex/unified-latex-to-hast';
import { toHtml } from 'hast-util-to-html';

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  latexDir: './latex',
  outputDir: './public/converted-docs',
  manifestFile: './public/documents-manifest.json',
};

const ICON_MAP = {
  faLinkedin: 'fab fa-linkedin',
  faGithub: 'fab fa-github',
  faEnvelope: 'fas fa-envelope',
  faMobile: 'fas fa-mobile',
};

const LIST_MARKERS = {
  start: '<span class="macro macro-resumeItemListStart"></span>',
  end: '<span class="macro macro-resumeItemListEnd"></span>',
  item: '<span class="macro macro-resumeItem"></span>',
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Ensures a directory exists, creating it recursively if needed
 */
function ensureDirectoryExists(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

/**
 * Extracts metadata from LaTeX document
 */
function extractMetadata(latexContent) {
  const titleMatch = latexContent.match(/\\title\{([^}]+)\}/);
  const authorMatch = latexContent.match(/\\author\{([^}]+)\}/);
  const dateMatch = latexContent.match(/\\date\{([^}]+)\}/);

  return {
    title: titleMatch ? titleMatch[1] : 'Untitled Document',
    author: authorMatch ? authorMatch[1] : 'Unknown Author',
    date: dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0],
  };
}

// =============================================================================
// LATEX MACRO PARSING
// =============================================================================

/**
 * Parses LaTeX macro arguments with proper brace counting
 * Handles nested braces correctly
 */
function parseLatexMacro(content, macroName, argCount) {
  const matches = [];
  const regex = new RegExp(`\\\\${macroName}\\{`, 'g');
  let match;

  while ((match = regex.exec(content)) !== null) {
    const startPos = match.index;
    let pos = match.index + match[0].length - 1;
    const args = [];
    let currentArg = '';
    let braceCount = 1;
    let parsedArgs = 0;

    while (parsedArgs < argCount && pos < content.length) {
      pos++;
      const char = content[pos];

      if (char === '{') {
        braceCount++;
        currentArg += char;
      } else if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          args.push(currentArg.trim());
          parsedArgs++;
          currentArg = '';
          // Look for next argument
          while (pos < content.length && content[pos] !== '{') {
            pos++;
          }
          if (pos < content.length) {
            braceCount = 1;
          }
        } else {
          currentArg += char;
        }
      } else {
        currentArg += char;
      }
    }

    if (args.length >= argCount) {
      const fullMatch = content.substring(startPos, pos + 1);
      matches.push([fullMatch, ...args]);
    }
  }

  return matches;
}

/**
 * Extracts all resume macro matches from LaTeX content
 */
function extractMacroMatches(latexContent) {
  return {
    trio: parseLatexMacro(latexContent, 'resumeTrioHeading', 3),
    quadDetails: parseLatexMacro(latexContent, 'resumeQuadHeadingDetails', 3),
    quadHeading: parseLatexMacro(latexContent, 'resumeQuadHeading', 4),
    sectionType: Array.from(
      latexContent.matchAll(
        /\\resumeSectionType\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}/g
      )
    ),
  };
}

// =============================================================================
// HTML TRANSFORMATION HELPERS
// =============================================================================

/**
 * Replaces FontAwesome icon macros with proper HTML elements
 */
function replaceIconMacros(html) {
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
function cleanText(text) {
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
function parseHrefCommand(hrefString) {
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
function hrefToAnchor(hrefString, makeBold = false) {
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

// =============================================================================
// HTML POST-PROCESSORS
// =============================================================================

/**
 * Replaces \maketitle placeholder with proper title block
 */
function processTitleBlock(html, metadata) {
  const maketitleRegex = /<p><span class="macro macro-maketitle"><\/span><\/p>/;
  const titleBlock = `
<h1 class="title">${metadata.title}</h1>
<div class="author">${metadata.author}</div>
<div class="date">${metadata.date}</div>
`;

  return maketitleRegex.test(html)
    ? html.replace(maketitleRegex, titleBlock)
    : html;
}

/**
 * Promotes heading levels (section->h2, subsection->h3)
 */
function promoteHeadings(html) {
  // Promote h4 to h3 first to avoid double promotion
  let result = html
    .replace(/<h4(\b[^>]*)>/g, '<h3$1>')
    .replace(/<\/h4>/g, '</h3>');

  // Then promote h3 to h2
  result = result
    .replace(/<h3(\b[^>]*)>/g, '<h2$1>')
    .replace(/<\/h3>/g, '</h2>');

  return result;
}

/**
 * Adds Abstract heading before abstract environment
 */
function processAbstract(html) {
  return html.replace(
    /(<div class="environment abstract">)/,
    '<h2>Abstract</h2>$1'
  );
}

/**
 * Replaces math pipe separators with typographic dots
 */
function replaceMathPipes(html) {
  return html.replace(
    /<span class="inline-math">\|<\/span>/g,
    '<span class="sep">·</span>'
  );
}

/**
 * Converts tabular contact header to grid layout
 */
function processContactHeader(html) {
  return html.replace(
    /<div class="environment tabular(?:\*|x)">([\s\S]*?)<\/div>(?=\s*<h2>)/,
    (match, inner) => {
      const innerClean = replaceIconMacros(
        inner
          .replace(/\n/g, ' ')
          .replace(/>\s*[Xlcrp@{}]+(?=\s|<)/g, ' ')
          .replace(/<span class="vspace"[^>]*><\/span>/g, ' ')
          .replace(/<span class="macro macro-uline"><\/span>/g, '')
          .replace(/\s{2,}/g, ' ')
          .trim()
      );

      const nameMatch = innerClean.match(
        /<span class="textsize-Huge">([\s\S]*?)<\/span>/
      );
      const name = nameMatch ? nameMatch[1].trim() : '';
      const afterName = innerClean.replace(
        /^[\s\S]*?<br class="linebreak">\s*/,
        ''
      );
      const ampIdx = afterName.indexOf('&#x26;');

      let primary = afterName;
      let secondary = '';
      if (ampIdx !== -1) {
        primary = afterName.slice(0, ampIdx).trim();
        secondary = afterName.slice(ampIdx + 5).trim();
      }

      let primaryClean = cleanText(primary);
      // Wrap mobile icon and phone number together
      primaryClean = primaryClean.replace(
        /(<i class="fas fa-(?:mobile|mobile-alt|phone)"><\/i>)\s*([+\d\s\-]+)/g,
        '<span class="contact-mobile">$1 $2</span>'
      );

      const secondaryClean = cleanText(secondary).replace(
        /^\s*[;:,\-–]\s*/,
        ''
      );
      const alignmentClass = secondaryClean
        ? 'contact dual'
        : 'contact centered';
      const rightColumn = secondaryClean
        ? `<div class="contact-right">${secondaryClean}</div>`
        : '';

      return `
<div class="${alignmentClass}">
  <div class="contact-left">
    <div class="contact-name">${name}</div>
    <div class="contact-links">${primaryClean}</div>
  </div>
  ${rightColumn}
</div>`;
    }
  );
}

/**
 * Processes resumeTrioHeading macros
 */
function processTrioHeadings(html, trioMatches) {
  let trioIdx = 0;

  return html.replace(
    /<span class="macro macro-resumeTrioHeading"><\/span>([\s\S]*?)(?=(<ul|<span|<\/div|<\/p))/g,
    (m) => {
      const parsed = trioMatches[trioIdx++];
      if (!parsed) return m;

      const [, title, tech, linkRaw] = parsed;
      const anchorHtml = hrefToAnchor(linkRaw);

      return `
<div class="trio">
  <div class="trio-title"><strong>${title.trim()}</strong></div>
  <div class="trio-tech"><em>${tech.trim()}</em></div>
  <div class="trio-link">${anchorHtml}</div>
</div>`;
    }
  );
}

/**
 * Processes resumeQuadHeadingDetails macros
 */
function processQuadDetails(html, quadDetailsMatches) {
  let idx = 0;

  return html.replace(
    /<span class="macro macro-resumeQuadHeadingDetails"><\/span>([\s\S]*?)(?=(<ul|<span|<\/div|<\/p))/g,
    (m) => {
      const parsed = quadDetailsMatches[idx++];
      if (!parsed) return m;

      const [, url, dateText, roleText] = parsed;

      const cleanDateText = dateText
        .replace(/\s*--\s*/g, ' – ')
        .replace(/\s+/g, ' ')
        .trim();

      const cleanRoleText = roleText.replace(/\s+/g, ' ').trim();
      const anchorHtml = hrefToAnchor(url, true);

      return `
<div class="quad-details">
  <div class="row"><div class="left">${anchorHtml}</div><div class="right"><span class="date">${cleanDateText}</span></div></div>
  <div class="row"><div class="left"><em>${cleanRoleText}</em></div><div class="right"></div></div>
</div>`;
    }
  );
}

/**
 * Merges split date ranges in quad-details blocks
 */
function mergeDateRanges(html) {
  // Case A: "Oct 2023 –" + left em starting with "Present ..."
  return html.replace(
    /(<div class="quad-details">[\s\S]*?<span class="date">)\s*([^<]*?–)\s*(<\/span>[\s\S]*?<div class="left"><em>)\s*Present\s+([^<]*?)(<\/em>)/g,
    (m, pre, startDash, mid, roleRest, end) =>
      `${pre}${startDash} Present${mid}${roleRest}${end}`
  );
}

/**
 * Processes Technical Skills section with sectionType macros
 */
function processTechnicalSkills(html, sectionTypeMatches) {
  const rows = sectionTypeMatches
    .map((s) => {
      const label = s[1].trim().replace(/\\&/g, '&');
      const sep = s[2].trim();
      const content = s[3].trim();

      return `
<div class="skill-row">
  <div class="skill-label"><strong>${label}</strong></div>
  <div class="skill-sep">${sep}</div>
  <div class="skill-content">${content}</div>
</div>`;
    })
    .join('');

  return html.replace(
    /<h2>Technical Skills<\/h2>[\s\S]*?(?=<h2>)/,
    `<h2>Technical Skills</h2><div class="resume-heading-list">${rows}</div>\n`
  );
}

/**
 * Processes resumeQuadHeading macros (for Education section)
 */
function processQuadHeadings(html, quadHeadingMatches) {
  let idx = 0;

  return html.replace(
    /<span class="macro macro-resumeQuadHeading"><\/span>([^<]*?)\s*(Bachelor of[^<]*?)\s*([A-Z][a-z]{2,9}\.\s\d{4}\s[–-]\s[A-Z][a-z]{2,9}\.\s\d{4})/g,
    (m, pre, degreeLine, dates) => {
      const parsed = quadHeadingMatches[idx++];

      if (parsed) {
        const uni = parsed[1].trim();
        const loc = parsed[2].trim();
        const degree = parsed[3].trim();
        const dateRange = (parsed[4] || dates)
          .replace(/\s*--\s*/g, ' – ')
          .replace(/\s+/g, ' ')
          .trim();

        return `
<div class="quad">
  <div class="row"><div class="left"><strong>${uni}</strong></div><div class="right">${loc}</div></div>
  <div class="row"><div class="left"><em>${degree}</em></div><div class="right"><em>${dateRange}</em></div></div>
</div>`;
      }

      // Fallback parsing
      const preTrim = (pre || '').replace(/\s+/g, ' ').trim();
      let uni = preTrim;
      let loc = '';

      const cityCountryMatch = preTrim.match(
        /^(.*?),\s*([A-Za-z''\- ]+,\s*[A-Za-z''\- ]+)$/
      );
      if (cityCountryMatch) {
        uni = cityCountryMatch[1].trim();
        loc = cityCountryMatch[2].trim();
      }

      const cleanDates = dates
        .replace(/\s*--\s*/g, ' – ')
        .replace(/\s+/g, ' ')
        .trim();

      return `
<div class="quad">
  <div class="row"><div class="left"><strong>${uni}</strong></div><div class="right">${loc}</div></div>
  <div class="row"><div class="left"><em>${degreeLine}</em></div><div class="right"><em>${cleanDates}</em></div></div>
</div>`;
    }
  );
}

/**
 * Converts custom list macros to semantic HTML lists
 */
function processListMacros(html) {
  let result = html;
  let searchStart = 0;

  while (true) {
    const startIdx = result.indexOf(LIST_MARKERS.start, searchStart);
    if (startIdx === -1) break;

    const endIdx = result.indexOf(LIST_MARKERS.end, startIdx);
    if (endIdx === -1) break;

    const before = result.slice(0, startIdx);
    const inner = result.slice(startIdx + LIST_MARKERS.start.length, endIdx);
    const after = result.slice(endIdx + LIST_MARKERS.end.length);

    const parts = inner.split(LIST_MARKERS.item).map((s) => s.trim());
    const items = parts
      .filter((part) => part)
      .map((part) => `<li>${part}</li>`)
      .join('');

    const ul = `<ul class="resume-items">${items}</ul>`;
    result = before + ul + after;
    searchStart = before.length + ul.length;
  }

  return result;
}

/**
 * Processes heading list macros
 */
function processHeadingListMacros(html) {
  return html
    .replace(
      /<span class="macro macro-resumeHeadingListStart"><\/span>/g,
      '<div class="resume-heading-list">'
    )
    .replace(
      /<span class="macro macro-resumeHeadingListEnd"><\/span>/g,
      '</div>'
    );
}

/**
 * Cleans up paragraph wrappers around block elements
 */
function cleanupParagraphWrappers(html) {
  return html
    .replace(/<p>\s*(<ul class="resume-items">)/g, '$1')
    .replace(/(<\/ul>)\s*<\/p>/g, '$1')
    .replace(/<p>\s*(<div class="resume-heading-list">)/g, '$1')
    .replace(/(<\/div>)\s*<\/p>/g, '$1')
    .replace(
      /<p>\s*(<(?:div) class="(?:contact|trio|quad|quad-details)">)/g,
      '$1'
    )
    .replace(/(<\/(?:div)>)\s*<\/p>/g, '$1')
    .replace(/<\/p>\s*(<div class="trio">)/g, '$1')
    .replace(
      /(<\/div>\s*<\/div>\s*)<div class="trio-tech">[\s\S]*?<\/div>\s*<div class="trio-link">[\s\S]*?<\/div>/,
      '$1'
    );
}

/**
 * Applies final HTML cleanup and fixes
 */
function applyFinalCleanups(html) {
  return (
    html
      // Fix missing spaces after percent symbols
      .replace(/(\d+)%([a-zA-Z])/g, '$1% $2')
      // Clean up leftover macro artifacts
      .replace(/<span class="macro macro-uline"><\/span>Source Code<\/a>/g, '')
      // Remove stray class="href" attributes
      .replace(/class="href"/g, '')
      // Fix double spaces in href attributes
      .replace(/<a  href=/g, '<a href=')
      // Add target="_blank" to external links
      .replace(
        /<a href="(https?:\/\/[^"]+)"/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer"'
      )
      // Clean up duplicate target="_blank" attributes
      .replace(
        /target="_blank" rel="noopener noreferrer" target="_blank" rel="noopener noreferrer"/g,
        'target="_blank" rel="noopener noreferrer"'
      )
  );
}

// =============================================================================
// HTML TEMPLATE
// =============================================================================

/**
 * Returns the CSS styles for the HTML document
 */
function getStyles() {
  return `
    html, body {
      background: #fff;
      margin: 0;
      padding: 0;
    }
    body {
      max-width: 950px;
      width: 100%;
      margin: 0 auto;
      padding: 2rem;
      font-family: "Source Sans 3", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      line-height: 1.6;
      color: #000;
      background: #fff;
      box-sizing: border-box;
    }
    * { box-sizing: border-box; }
    h1, h2, h3, h4, h5, h6 {
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      font-weight: bold;
    }
    h1 { font-size: 5em; text-align: center; }
    h2 { font-size: 1.5em; font-variant: small-caps; color: #1e3a8a; border-bottom: 1px solid #1e3a8a; padding-bottom: 0.25rem; margin-top: 1.2em; }
    h3 { font-size: 1.2em; }
    .author { text-align: center; font-style: italic; margin: 1em 0; }
    .date { text-align: center; margin-bottom: 2em; }
    .title { margin-top: 0.5em; }
    p { margin: 1em 0; text-align: left; }
    .theorem, .lemma, .proposition, .corollary {
      font-style: italic;
      margin: 1em 0;
      padding: 0.5em;
      border-left: 3px solid #333;
    }
    .proof { margin: 1em 0 1em 2em; }
    code, pre {
      font-family: "Courier New", monospace;
      background: #f5f5f5;
      padding: 0.2em 0.4em;
    }
    pre { padding: 1em; overflow-x: auto; }
    .equation { margin: 1em 0; overflow-x: auto; }
    a { color: #0066cc; text-decoration: none; cursor: pointer; }
    a:hover { color: #004499; text-decoration: none; }
    a:visited { color: #551a8b; text-decoration: none; }
    .resume-items { margin: 0.25rem 0 1rem 1.25rem; }
    .resume-items li { margin: 0.25rem 0; }
    .resume-heading-list { margin: 0.25rem 0 0.5rem 0; }
    .contact { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }
    .contact.centered { grid-template-columns: 1fr; text-align: center; }
    .contact.centered .contact-name { justify-self: center; }
    .contact.centered .contact-links { justify-self: center; }
    .contact-name { font-size: 1.75rem; font-weight: 700; }
    .contact-links { color: #111; display: flex; flex-wrap: wrap; justify-content: center; gap: 0.5rem; align-items: center; }
    .contact-links a { display: inline-flex; align-items: center; gap: 0.25rem; }
    .contact-links i { 
      color: #1e3a8a; 
      font-style: normal; 
      font-variant: normal; 
      text-rendering: auto; 
      -webkit-font-smoothing: antialiased; 
      display: inline-block;
      font-family: "Font Awesome 6 Free", "Font Awesome 6 Brands", "Font Awesome 6 Pro";
      font-weight: 900;
    }
    .contact-links i.fab { font-family: "Font Awesome 6 Brands"; font-weight: 400; }
    .contact-links > i { display: inline-flex; align-items: center; gap: 0.25rem; }
    .contact-sep { color: #666; margin: 0 0.25rem; }
    .contact-mobile { display: inline-flex; align-items: center; gap: 0.25rem; }
    .contact-right { text-align: right; white-space: nowrap; }
    .sep { margin: 0 0.35rem; color: #666; }
    .trio { display: grid; grid-template-columns: 1fr auto auto; gap: 0.5rem; align-items: baseline; margin: 0.25rem 0; position: relative; }
    .trio-title { justify-self: start; white-space: nowrap; }
    .trio-tech { position: absolute; left: 50%; transform: translateX(-50%); color: #374151; white-space: nowrap; }
    .trio-link { justify-self: end; white-space: nowrap; }
    .quad, .quad-details { margin: 0.25rem 0; }
    .row { display: grid; grid-template-columns: 1fr auto; align-items: baseline; }
    .row .left, .row .right { white-space: nowrap; }
    .row .right { text-align: right; color: #374151; }
    .skill-row { display: grid; grid-template-columns: 0.28fr 0.01fr 0.71fr; align-items: start; gap: 0.5rem; }
    .skill-label { font-weight: 700; }
    .skill-sep { text-align: center; }
    .macro { display: none; }
    .converter-footer {
      margin-top: 3rem;
      padding-top: 1rem;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 0.875rem;
      color: #6b7280;
    }
    .converter-footer a { color: #3b82f6; text-decoration: none; }
    .converter-footer a:hover { text-decoration: underline; }

    @media (max-width: 768px) {
      body { padding: 1rem; }
      h1 { font-size: 5em; }
      h2 { font-size: 1.25em; margin-top: 1em; }
      .contact-name { font-size: 1.5rem; }
      .contact-links { font-size: 0.9rem; gap: 0.4rem; }
      .trio { grid-template-columns: 1fr; gap: 0.25rem; margin: 0.5rem 0; }
      .trio-title { justify-self: start; white-space: normal; }
      .trio-tech { position: static; transform: none; left: auto; justify-self: start; white-space: normal; }
      .trio-link { justify-self: start; white-space: normal; }
      .row { grid-template-columns: 1fr; gap: 0.25rem; }
      .row .left, .row .right { white-space: normal; }
      .row .right { text-align: left; }
      .skill-row { grid-template-columns: 1fr; gap: 0.25rem; }
      .skill-label { margin-bottom: 0.25rem; }
      .skill-sep { display: none; }
      .skill-content { margin-left: 0; }
      .contact { grid-template-columns: 1fr; gap: 0.5rem; }
      .contact-right { text-align: left; white-space: normal; }
    }

    @media (max-width: 480px) {
      body { padding: 0.75rem; }
      h1 { font-size: 5em; }
      h2 { font-size: 1.1em; }
      .contact-name { font-size: 1.25rem; }
      .contact-links { font-size: 0.85rem; flex-direction: column; align-items: flex-start; }
      .resume-items { margin-left: 1rem; }
    }
  `;
}

/**
 * Wraps content in full HTML document template
 */
function wrapInHtmlTemplate(content, metadata) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${metadata.title}</title>
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,300..900;1,300..900&display=swap" rel="stylesheet">
    <!-- Font Awesome 6.5.2 - Primary CDN -->
    <link rel="stylesheet" href="https://use.fontawesome.com/releases/v6.5.2/css/all.css" integrity="sha384-B4dIYHKNBt8Bc12p+WXckhzcICo0wtJAoU8YZTY5qE0Id1GSseTk6S+L3BlXeVIU" crossorigin="anonymous" />
    <!-- Font Awesome Fallback CDN -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <style>${getStyles()}</style>
</head>
<body>
    ${content}
    <div class="converter-footer">
        Generated with <a href="https://github.com/dytsou/resume" target="_blank" rel="noopener">LaTeX to HTML Converter</a><br>
        © 2025 Tsou, Dong-You. Licensed under <a href="https://github.com/dytsou/resume/blob/main/LICENSE" target="_blank" rel="noopener">MIT License</a>
    </div>
</body>
</html>`;
}

// =============================================================================
// MAIN CONVERSION FUNCTION
// =============================================================================

/**
 * Converts LaTeX content to styled HTML
 */
function convertLatexToHtml(latexContent, filename) {
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

// =============================================================================
// ENTRY POINT
// =============================================================================

/**
 * Main function - processes all LaTeX files and generates HTML
 */
function main() {
  console.log('Starting LaTeX to HTML conversion...');

  ensureDirectoryExists(CONFIG.outputDir);

  if (!existsSync(CONFIG.latexDir)) {
    console.error(`Error: LaTeX directory not found: ${CONFIG.latexDir}`);
    process.exit(1);
  }

  const files = readdirSync(CONFIG.latexDir).filter(
    (file) => extname(file) === '.tex'
  );

  if (files.length === 0) {
    console.log('No LaTeX files found in the latex directory.');
    writeFileSync(CONFIG.manifestFile, JSON.stringify([], null, 2));
    process.exit(0);
  }

  console.log(`Found ${files.length} LaTeX file(s) to convert.`);

  const manifest = [];
  let hasErrors = false;

  for (const file of files) {
    const filePath = join(CONFIG.latexDir, file);
    const fileBasename = basename(file, '.tex');
    const outputPath = join(CONFIG.outputDir, `${fileBasename}.html`);

    console.log(`Converting: ${file}`);

    try {
      const latexContent = readFileSync(filePath, 'utf-8');
      const result = convertLatexToHtml(latexContent, fileBasename);

      if (result.success) {
        writeFileSync(outputPath, result.html);

        manifest.push({
          id: fileBasename,
          filename: file,
          title: result.metadata.title,
          author: result.metadata.author,
          date: result.metadata.date,
          htmlPath: `converted-docs/${fileBasename}.html`,
          lastConverted: new Date().toISOString(),
        });

        console.log(`  ✓ Successfully converted to: ${outputPath}`);
      } else {
        console.error(`  ✗ Failed to convert ${file}: ${result.error}`);
        hasErrors = true;
      }
    } catch (error) {
      console.error(`  ✗ Error processing ${file}: ${error.message}`);
      hasErrors = true;
    }
  }

  writeFileSync(CONFIG.manifestFile, JSON.stringify(manifest, null, 2));
  console.log(`\nManifest written to: ${CONFIG.manifestFile}`);
  console.log(
    `Successfully converted: ${manifest.length}/${files.length} files`
  );

  if (hasErrors) {
    console.error(
      '\nSome files failed to convert. Fix errors before deployment.'
    );
    process.exit(1);
  } else {
    console.log('\nAll LaTeX files converted successfully!');
    process.exit(0);
  }
}

main();
