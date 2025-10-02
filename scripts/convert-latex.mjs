import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join, basename, extname } from 'path';
import { parse } from '@unified-latex/unified-latex-util-parse';
import { unified } from 'unified';
import { unifiedLatexToHast } from '@unified-latex/unified-latex-to-hast';
import { toHtml } from 'hast-util-to-html';

const LATEX_DIR = './latex';
const OUTPUT_DIR = './public/converted-docs';
const MANIFEST_FILE = './public/documents-manifest.json';

function ensureDirectoryExists(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function extractMetadata(latexContent) {
  const titleMatch = latexContent.match(/\\title\{([^}]+)\}/);
  const authorMatch = latexContent.match(/\\author\{([^}]+)\}/);
  const dateMatch = latexContent.match(/\\date\{([^}]+)\}/);

  return {
    title: titleMatch ? titleMatch[1] : 'Untitled Document',
    author: authorMatch ? authorMatch[1] : 'Unknown Author',
    date: dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0]
  };
}

function convertLatexToHtml(latexContent, filename) {
  try {
    const ast = parse(latexContent);
    const hast = unified().use(unifiedLatexToHast).runSync(ast);
    // Generate raw HTML from HAST
    let html = toHtml(hast);

    // Extract metadata for title block
    const metadata = extractMetadata(latexContent);

    // Post-process HTML to better mirror LaTeX semantics/typography
    // 1) Remove the placeholder produced for \\maketitle and inject a proper title block
    const maketitleRegex = /<p><span class="macro macro-maketitle"><\/span><\/p>/;
    const titleBlock = `\n<h1 class="title">${metadata.title}<\/h1>\n<div class="author">${metadata.author}<\/div>\n<div class="date">${metadata.date}<\/div>\n`;
    if (maketitleRegex.test(html)) {
      html = html.replace(maketitleRegex, titleBlock);
    }

    // 2) Promote heading levels (section->h2, subsection->h3)
    // Promote h4 to h3 first to avoid double promotion issues
    html = html.replace(/<h4(\b[^>]*)>/g, '<h3$1>')
      .replace(/<\/h4>/g, '<\/h3>');
    // Then promote h3 to h2
    html = html.replace(/<h3(\b[^>]*)>/g, '<h2$1>')
      .replace(/<\/h3>/g, '<\/h2>');

    // 3) Add an "Abstract" heading before the abstract environment, if present
    html = html.replace(
      /(<div class="environment abstract">)/,
      '<h2>Abstract<\/h2>$1'
    );

    // 4) Resume-specific post-processing to approximate LaTeX packages/macros (always resume)
    {
      // Pre-parse macro arguments from LaTeX source so we can align by {}
      const trioMatches = Array.from(
        latexContent.matchAll(/\\resumeTrioHeading\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}/g)
      );
      let trioIdx = 0;
      // Parse resumeQuadHeadingDetails with robust nested braces handling
      const quadDetailsMatches = [];

      // Function to parse LaTeX macro arguments with proper brace counting
      const parseLatexMacro = (content, macroName) => {
        const matches = [];
        const regex = new RegExp(`\\\\${macroName}\\{`, 'g');
        let match;


        while ((match = regex.exec(content)) !== null) {
          const startPos = match.index;
          let pos = match.index + match[0].length - 1; // Position after opening brace
          const args = [];
          let currentArg = '';
          let braceCount = 1;
          let argCount = 0;

          // Parse arguments (3 for resumeQuadHeadingDetails, 4 for resumeQuadHeading)
          const maxArgs = macroName === 'resumeQuadHeading' ? 4 : 3;
          while (argCount < maxArgs && pos < content.length) {
            pos++;
            const char = content[pos];

            if (char === '{') {
              braceCount++;
              currentArg += char;
            } else if (char === '}') {
              braceCount--;
              if (braceCount === 0) {
                // End of current argument
                args.push(currentArg.trim());
                argCount++;
                currentArg = '';
                // Look for next argument
                while (pos < content.length && content[pos] !== '{') {
                  pos++;
                }
                if (pos < content.length) {
                  braceCount = 1; // Reset for next argument
                }
              } else {
                // Still inside nested braces
                currentArg += char;
              }
            } else {
              currentArg += char;
            }
          }

          if (args.length >= maxArgs) {
            const fullMatch = content.substring(startPos, pos + 1);
            matches.push([fullMatch, ...args]);
          }
        }

        return matches;
      };

      quadDetailsMatches.push(...parseLatexMacro(latexContent, 'resumeQuadHeadingDetails'));

      // Also parse resumeQuadHeading (used in Education section)
      const quadHeadingMatches = parseLatexMacro(latexContent, 'resumeQuadHeading');

      // Debug: log the trio matches
      console.log('Trio matches:', trioMatches);
      let quadDetailsIdx = 0;
      const sectionTypeMatches = Array.from(
        latexContent.matchAll(/\\resumeSectionType\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}/g)
      );
      let sectionTypeIdx = 0;
      // Replace math pipes with typographic separators
      html = html.replace(/<span class="inline-math">\|<\/span>/g, '<span class="sep">·<\/span>');

      // Convert first tabular* (contact header) into a two-column grid up to next section
      html = html.replace(
        /<div class="environment tabular\*">([\s\S]*?)<\/div>(?=\s*<h2>)/,
        (match, inner) => {
          const innerClean = inner.replace(/\n/g, ' ');
          const nameMatch = innerClean.match(/<span class="textsize-Huge">([\s\S]*?)<\/span>/);
          const name = nameMatch ? nameMatch[1].trim() : '';
          const afterName = innerClean.replace(/^[\s\S]*?<br class="linebreak">\s*/, '');
          const ampIdx = afterName.indexOf('&#x26;');
          let left = afterName;
          let right = '';
          if (ampIdx !== -1) {
            left = afterName.slice(0, ampIdx).trim();
            right = afterName.slice(ampIdx + 5).trim();
          }
          // Clean linebreaks and ensure typographic separators
          left = left.replace(/<br class="linebreak">/g, ' ').replace(/<span class="inline-math">\|<\/span>/g, '<span class="sep">·<\/span>').trim();
          right = right.replace(/<br class="linebreak">/g, ' ').replace(/<span class="inline-math">\|<\/span>/g, '<span class="sep">·<\/span>').trim();
          // Clean leading punctuation artifacts on right
          right = right.replace(/^\s*[;:,\-–]\s*/, '');
          return `\n<div class="contact">\n  <div class="contact-left">\n    <div class="contact-name">${name}<\/div>\n    <div class="contact-links">${left}<\/div>\n  <\/div>\n  <div class="contact-right">${right}<\/div>\n<\/div>`;
        }
      );

      // Convert Trio heading macro into semantic three-column row (brace-driven)
      html = html.replace(
        /<span class="macro macro-resumeTrioHeading"><\/span>([\s\S]*?)(?=(<ul|<span|<\/div|<\/p))/g,
        (m, content) => {
          const parsed = trioMatches[trioIdx++] || null;
          if (!parsed) {
            // Fallback to original content if parsing failed
            return m;
          }

          let [fullMatch, title, tech, link] = parsed;

          // Debug: log the parsed data
          console.log('Trio parsed data:', { title, tech, link });
          console.log('Full match:', fullMatch);
          console.log('Link contains href:', link.includes('\\href{'));
          console.log('Link length:', link.length);

          // Check if the link is incomplete (missing closing braces)
          if (link.includes('\\href{') && !link.includes('}{')) {
            console.log('Incomplete href detected, trying to fix...');
            // Try to find the complete href in the full match
            const completeHrefMatch = fullMatch.match(/\\href\{[^}]+\}\{[^}]+\}/);
            if (completeHrefMatch) {
              console.log('Found complete href:', completeHrefMatch[0]);
              // Update the link with the complete href
              const updatedLink = completeHrefMatch[0];
              console.log('Updated link:', updatedLink);
              // Use the updated link for processing
              link = updatedLink;
            } else {
              // If we can't find the complete href in the full match, try to find it in the original LaTeX content
              const originalHrefMatch = latexContent.match(/\\href\{[^}]+\}\{[^}]+\}/g);
              if (originalHrefMatch) {
                // Find the href that matches our incomplete link
                const matchingHref = originalHrefMatch.find(href => href.startsWith(link));
                if (matchingHref) {
                  console.log('Found matching href in original content:', matchingHref);
                  link = matchingHref;
                }
              }
            }
          }

          // Check if the link contains \href command (from LaTeX source)
          let anchorHtml = '';
          if (link.includes('\\href{')) {
            // Extract URL and display text from \href{url}{text} format
            // Handle nested commands like \href{url}{\uline{text}}
            const hrefMatch = link.match(/\\href\{([^}]+)\}\{([^}]+)\}/);
            if (hrefMatch) {
              const [, hrefUrl, hrefText] = hrefMatch;
              // Clean up any nested LaTeX commands in the display text
              const cleanText = hrefText.replace(/\\uline\{([^}]+)\}/g, '$1').replace(/\\uline\{([^}]*)$/g, '$1');
              anchorHtml = `<a class="href" href="${hrefUrl}">${cleanText}</a>`;
            } else {
              // Try a more complex pattern to handle deeply nested commands
              const complexMatch = link.match(/\\href\{([^}]+)\}\{([^}]+)\}/);
              if (complexMatch) {
                const [, hrefUrl, hrefText] = complexMatch;
                const cleanText = hrefText.replace(/\\uline\{([^}]+)\}/g, '$1').replace(/\\uline\{([^}]*)$/g, '$1');
                anchorHtml = `<a class="href" href="${hrefUrl}">${cleanText}</a>`;
              } else {
                // Fallback if \href parsing fails
                anchorHtml = link;
              }
            }
          } else {
            // If no \href, treat as plain text
            anchorHtml = link;
          }

          return `\n<div class="trio">\n  <div class="trio-title"><strong>${title.trim()}<\/strong><\/div>\n  <div class="trio-tech"><em>${tech.trim()}<\/em><\/div>\n  <div class="trio-link">${anchorHtml}<\/div>\n<\/div>`;
        }
      );

      // Merge date ranges like "Oct 2023 –" with trailing "Present" or month on next row
      html = html.replace(
        /(<div class=\"quad-details\">[\s\S]*?<div class=\"right\"><span class=\"date\">\s*([^<]*?–)\s*<\/span><\/div>[\s\S]*?<div class=\"left\"><em>)\s*(Present|[A-Z][a-z]{2}\s\d{4})\s*([^<]*)(<\/em><\/div><div class=\"right\">)/g,
        (m, prefix, startDash, word, restRole, suffix) => {
          const date = `${startDash} ${word}`.replace(/\s+/g, ' ').trim();
          const role = restRole.replace(/^\s*[–-]?\s*/, '').trim();
          return `${prefix}${role}${suffix}<span class=\"date\">${date}<\/span>`;
        }
      );

      // Convert QuadHeadingDetails macro into 2x2 block (brace-driven)
      // Use parsed data from LaTeX source to ensure proper structure
      html = html.replace(
        /<span class="macro macro-resumeQuadHeadingDetails"><\/span>([\s\S]*?)(?=(<ul|<span|<\/div|<\/p))/g,
        (m, content) => {
          const parsed = quadDetailsMatches[quadDetailsIdx++] || null;
          if (!parsed) {
            // Fallback to original content if parsing failed
            return m;
          }

          const [fullMatch, url, dateText, roleText] = parsed;

          // Clean up date text - preserve periods in month abbreviations and fix dash formatting
          const cleanDateText = dateText.replace(/\s*--\s*/g, ' – ')
            .replace(/\s+/g, ' ')
            .trim();

          // Clean up role text
          const cleanRoleText = roleText.replace(/\s+/g, ' ').trim();

          // Check if the URL contains \href command (from LaTeX source)
          let anchorHtml = '';
          if (url.includes('\\href{')) {
            // Extract URL and display text from \href{url}{text} format
            const hrefMatch = url.match(/\\href\{([^}]+)\}\{([^}]+)\}/);
            if (hrefMatch) {
              const [, hrefUrl, hrefText] = hrefMatch;
              // Make the link text bold while keeping it as a clickable link
              anchorHtml = `<a class="href" href="${hrefUrl}"><strong>${hrefText}</strong></a>`;
            } else {
              // Fallback if \href parsing fails
              anchorHtml = `<strong>${url}</strong>`;
            }
          } else {
            // If no \href, treat as plain text and make it bold
            anchorHtml = `<strong>${url}</strong>`;
          }

          return `\n<div class="quad-details">\n  <div class="row"><div class="left">${anchorHtml}<\/div><div class="right"><span class="date">${cleanDateText}<\/span><\/div><\/div>\n  <div class="row"><div class="left"><em>${cleanRoleText}<\/em><\/div><div class="right"><\/div><\/div>\n<\/div>`;
        }
      );

      // Clean up any remaining duplicate content that might have been created
      // This handles cases where the macro replacement left behind raw text
      html = html.replace(
        /(<a[^>]*>.*?<\/a>)([A-Z][a-z]{2,4}\.\s\d{4}\s[–-]\s[A-Z][a-z]{2,4}\.\s\d{4})\s*([^<]*?)(?=<ul|<span|<\/div|<\/p)/g,
        (m, anchor, dateRange, role) => {
          // Only process if this looks like a duplicate (no surrounding div structure)
          if (!m.includes('class="quad-details"') && !m.includes('class="row"')) {
            return ''; // Remove the duplicate
          }
          return m; // Keep the original if it's already properly formatted
        }
      );

      // After rendering quad-details, merge split date ranges with role prefixes
      // Case A: "Oct 2023 –" + left em starting with "Present ..."
      html = html.replace(
        /(<div class=\"quad-details\">[\s\S]*?<span class=\"date\">)\s*([^<]*?–)\s*(<\/span>[\s\S]*?<div class=\"left\"><em>)\s*Present\s+([^<]*?)(<\/em>)/g,
        (m, pre, startDash, mid, roleRest, end) => `${pre}${startDash} Present${mid}${roleRest}${end}`
      );

      // Case B: Disabled - was causing incorrect merging of complete date ranges with role text
      // The issue is now fixed in the QuadHeadingDetails parsing above

      // Replace entire Technical Skills block using brace-driven rows up to the next <h2>
      {
        const rows = sectionTypeMatches.map(s => {
          const label = s[1].trim();
          const sep = s[2].trim();
          const content = s[3].trim();
          // Remove LaTeX escaping from ampersands in labels
          const cleanLabel = label.replace(/\\&/g, '&');
          return `\n<div class=\"skill-row\">\n  <div class=\"skill-label\"><strong>${cleanLabel}<\/strong><\/div>\n  <div class=\"skill-sep\">${sep}<\/div>\n  <div class=\"skill-content\">${content}<\/div>\n<\/div>`;
        }).join('');
        html = html.replace(/<h2>Technical Skills<\/h2>[\s\S]*?(?=<h2>)/, `<h2>Technical Skills<\/h2><div class=\"resume-heading-list\">${rows}<\/div>\n`);
      }

      // Convert QuadHeading macro into 2x2 block using parsed data
      let quadHeadingIdx = 0;
      html = html.replace(
        /<span class="macro macro-resumeQuadHeading"><\/span>([^<]*?)\s*(Bachelor of[^<]*?)\s*([A-Z][a-z]{2,9}\.\s\d{4}\s[–-]\s[A-Z][a-z]{2,9}\.\s\d{4})/g,
        (m, pre, degreeLine, dates) => {
          const parsed = quadHeadingMatches[quadHeadingIdx++] || null;
          if (parsed) {
            // Use parsed data from LaTeX source
            const uni = parsed[1].trim();
            const loc = parsed[2].trim();
            const degree = parsed[3].trim();
            let dateRange = parsed[4] ? parsed[4].trim() : dates;

            // Clean up date range - preserve periods and fix dash formatting
            dateRange = dateRange.replace(/\s*--\s*/g, ' – ')
              .replace(/\s+/g, ' ')
              .trim();

            return `\n<div class="quad">\n  <div class="row"><div class="left"><strong>${uni}<\/strong><\/div><div class="right">${loc}<\/div><\/div>\n  <div class="row"><div class="left"><em>${degree}<\/em><\/div><div class="right"><em>${dateRange}<\/em><\/div><\/div>\n<\/div>`;
          } else {
            // Fallback to original logic if parsing failed
            const preTrim = (pre || '').replace(/\s+/g, ' ').trim();
            let uni = preTrim;
            let loc = '';
            // Case 1: Standard trailing ", City, Country"
            const cityCountryMatch = preTrim.match(/^(.*?),\s*([A-Za-z'’\- ]+,\s*[A-Za-z'’\- ]+)$/);
            if (cityCountryMatch) {
              uni = cityCountryMatch[1].trim();
              loc = cityCountryMatch[2].trim();
            } else {
              const gluedMatch = preTrim.match(/^(.*?University)\s*(Hsinchu,\s*Taiwan)$/i);
              if (gluedMatch) {
                uni = gluedMatch[1].trim();
                loc = gluedMatch[2].trim();
              }
            }
            const cleanDates = dates.replace(/\s*--\s*/g, ' – ').replace(/\s+/g, ' ').trim();
            return `\n<div class="quad">\n  <div class="row"><div class="left"><strong>${uni}<\/strong><\/div><div class="right">${loc}<\/div><\/div>\n  <div class="row"><div class="left"><em>${degreeLine}<\/em><\/div><div class="right"><em>${cleanDates}<\/em><\/div><\/div>\n<\/div>`;
          }
        }
      );

      // Convert custom list macros to semantic lists
      const LIST_START = '<span class="macro macro-resumeItemListStart"></span>';
      const LIST_END = '<span class="macro macro-resumeItemListEnd"></span>';
      const ITEM = '<span class="macro macro-resumeItem"></span>';

      // Process each list block iteratively
      let searchStart = 0;
      while (true) {
        const startIdx = html.indexOf(LIST_START, searchStart);
        if (startIdx === -1) break;
        const endIdx = html.indexOf(LIST_END, startIdx);
        if (endIdx === -1) break;

        const before = html.slice(0, startIdx);
        const inner = html.slice(startIdx + LIST_START.length, endIdx);
        const after = html.slice(endIdx + LIST_END.length);

        // Split by ITEM markers; ignore leading empty chunk
        const parts = inner.split(ITEM).map(s => s.trim());
        const items = [];
        for (const part of parts) {
          if (!part) continue;
          // Close item content when it reaches the next ITEM or end; since we split, wrap directly
          items.push(`<li>${part}</li>`);
        }
        const ul = `<ul class="resume-items">${items.join('')}</ul>`;
        html = before + ul + after;
        searchStart = before.length + ul.length;
      }

      // Remove container list macros that can appear around headings
      html = html
        .replace(/<span class="macro macro-resumeHeadingListStart"><\/span>/g, '<div class="resume-heading-list">')
        .replace(/<span class="macro macro-resumeHeadingListEnd"><\/span>/g, '<\/div>');

      // Tidy up stray paragraph wrappers around our new blocks
      html = html
        .replace(/<p>\s*(<ul class="resume-items">)/g, '$1')
        .replace(/(<\/ul>)\s*<\/p>/g, '$1')
        .replace(/<p>\s*(<div class="resume-heading-list">)/g, '$1')
        .replace(/(<\/div>)\s*<\/p>/g, '$1')
        .replace(/<p>\s*(<(?:div) class=\"(?:contact|trio|quad|quad-details)\">)/g, '$1')
        .replace(/(<\/(?:div)>)\s*<\/p>/g, '$1')
        .replace(/<\/p>\s*(<div class=\"trio\">)/g, '$1')
        .replace(/(<\/div>\s*<\/div>\s*)<div class=\"trio-tech\">[\s\S]*?<\/div>\s*<div class=\"trio-link\">[\s\S]*?<\/div>/, '$1');

      // Fix missing spaces after percent symbols
      html = html.replace(/(\d+)%([a-zA-Z])/g, '$1% $2');

      // Clean up leftover macro artifacts from Trio headings
      html = html.replace(/<span class="macro macro-uline"><\/span>Source Code<\/a>/g, '');
    }


    const styledHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${metadata.title}</title>
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,300..900;1,300..900&display=swap" rel="stylesheet">
    <style>
        body {
            width: 800px;
            margin: 0 auto;
            padding: 2rem;
            font-family: "Source Sans 3", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
            line-height: 1.6;
            color: #000;
            background: #fff;
        }
        h1, h2, h3, h4, h5, h6 {
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            font-weight: bold;
        }
        h1 { font-size: 2em; text-align: center; }
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
        .proof {
            margin: 1em 0 1em 2em;
        }
        code, pre {
            font-family: "Courier New", monospace;
            background: #f5f5f5;
            padding: 0.2em 0.4em;
        }
        pre {
            padding: 1em;
            overflow-x: auto;
        }
        .equation {
            margin: 1em 0;
            overflow-x: auto;
        }
        a { color: #0066cc; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .resume-items { margin: 0.25rem 0 1rem 1.25rem; }
        .resume-items li { margin: 0.25rem 0; }
        .resume-heading-list { margin: 0.25rem 0 0.5rem 0; }
        .contact { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }
        .contact-name { font-size: 1.75rem; font-weight: 700; white-space: nowrap; }
        .contact-links { color: #111; white-space: nowrap; }
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
        .skill-row { display: grid; grid-template-columns: 0.23fr 0.01fr 0.76fr; align-items: start; gap: 0.5rem; }
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
        .converter-footer a {
            color: #3b82f6;
            text-decoration: none;
        }
        .converter-footer a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    ${html}
    <div class="converter-footer">
        Generated with <a href="https://github.com/dytsou/resume" target="_blank" rel="noopener">LaTeX to HTML Converter</a><br>
        © 2025 Tsou, Dong-You. Licensed under <a href="https://github.com/dytsou/resume/blob/main/LICENSE" target="_blank" rel="noopener">MIT License</a>
    </div>
</body>
</html>
    `.trim();

    return { html: styledHtml, metadata, success: true, error: null };
  } catch (error) {
    return { html: null, metadata: null, success: false, error: error.message };
  }
}

function main() {
  console.log('Starting LaTeX to HTML conversion...');

  ensureDirectoryExists(OUTPUT_DIR);

  if (!existsSync(LATEX_DIR)) {
    console.error(`Error: LaTeX directory not found: ${LATEX_DIR}`);
    process.exit(1);
  }

  const files = readdirSync(LATEX_DIR).filter(file => extname(file) === '.tex');

  if (files.length === 0) {
    console.log('No LaTeX files found in the latex directory.');
    writeFileSync(MANIFEST_FILE, JSON.stringify([], null, 2));
    process.exit(0);
  }

  console.log(`Found ${files.length} LaTeX file(s) to convert.`);

  const manifest = [];
  let hasErrors = false;

  for (const file of files) {
    const filePath = join(LATEX_DIR, file);
    const fileBasename = basename(file, '.tex');
    const outputPath = join(OUTPUT_DIR, `${fileBasename}.html`);

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
          // Use a relative path so it works under any Vite base URL
          htmlPath: `converted-docs/${fileBasename}.html`,
          lastConverted: new Date().toISOString()
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

  writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2));
  console.log(`\nManifest written to: ${MANIFEST_FILE}`);
  console.log(`Successfully converted: ${manifest.length}/${files.length} files`);

  if (hasErrors) {
    console.error('\n❌ Some files failed to convert. Fix errors before deployment.');
    process.exit(1);
  } else {
    console.log('\n✅ All LaTeX files converted successfully!');
    process.exit(0);
  }
}

main();
