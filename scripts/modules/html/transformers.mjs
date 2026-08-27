/**
 * HTML post-processing transformation functions
 * Each function applies a specific transformation to the HTML
 */

import { LIST_MARKERS } from '../../shared/config.mjs';
import { replaceIconMacros, cleanText, hrefToAnchor } from './helpers.mjs';

/**
 * Replaces \maketitle placeholder with proper title block
 */
export function processTitleBlock(html, metadata) {
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
export function promoteHeadings(html) {
  // Promote h4 to h3 first to avoid double promotion
  let result = html
    .replace(/<h4(\b[^>]*)>/g, '<h3$1>')
    .replaceAll('</h4>', '</h3>');

  // Then promote h3 to h2
  result = result
    .replace(/<h3(\b[^>]*)>/g, '<h2$1>')
    .replaceAll('</h3>', '</h2>');

  return result;
}

/**
 * Adds Abstract heading before abstract environment
 */
export function processAbstract(html) {
  return html.replace(
    /(<div class="environment abstract">)/,
    '<h2>Abstract</h2>$1'
  );
}

/**
 * Replaces math pipe separators with typographic dots
 */
export function replaceMathPipes(html) {
  return html.replaceAll(
    '<span class="inline-math">|</span>',
    '<span class="sep">·</span>'
  );
}

/**
 * Converts tabular contact header to grid layout
 */
export function processContactHeader(html) {
  return html.replace(
    /<div class="environment tabular[*x]">([\s\S]*?)<\/div>(?=\s*<h2>)/,
    (match, inner) => {
      const innerClean = replaceIconMacros(
        inner
          .replaceAll('\n', ' ')
          .replace(/>\s*[Xlcrp@{}]+(?=\s|<)/g, ' ')
          .replace(/<span class="vspace"[^>]*><\/span>/g, ' ')
          .replaceAll('<span class="macro macro-uline"></span>', '')
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
        /(<i class="fas fa-(?:mobile|mobile-alt|phone)"><\/i>)\s*([-+\d\s]+)/g,
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
 * Processes resumeTrioHeadingTitle macros (4-argument version)
 */
export function processTrioHeadings(html, trioMatches) {
  let trioIdx = 0;

  return html.replace(
    /<span class="macro macro-resumeTrioHeadingTitle"><\/span>([\s\S]*?)(?=(<ul|<span|<\/div|<\/p))/g,
    (m) => {
      const parsed = trioMatches[trioIdx++];
      if (!parsed) return m;

      const [, title, tech, linkRaw, role] = parsed;
      const anchorHtml = hrefToAnchor(linkRaw);

      return `
<div class="trio">
  <div class="trio-title"><strong>${title.trim()}</strong></div>
  <div class="trio-tech"><em>${tech.trim()}</em></div>
  <div class="trio-link">${anchorHtml}</div>
</div>
<div class="role"><em>${role.trim()}</em></div>`;
    }
  );
}

/**
 * Processes resumeQuadHeadingDetails macros
 */
export function processQuadDetails(html, quadDetailsMatches) {
  let idx = 0;

  return html.replace(
    /<span class="macro macro-resumeQuadHeadingDetails"><\/span>([\s\S]*?)(?=(<ul|<span|<\/div|<\/p))/g,
    (m) => {
      const parsed = quadDetailsMatches[idx++];
      if (!parsed) return m;

      const [, url, dateText, roleText] = parsed;

      const cleanDateText = normalizeDateText(dateText);

      const cleanRoleText = normalizeWhitespace(roleText);
      const anchorHtml = hrefToAnchor(url, true);

      return `
<div class="quad-details">
  <div class="row"><div class="left">${anchorHtml}</div><div class="right"><span class="date">${cleanDateText}</span></div></div>
  <div class="row"><div class="left role"><em>${cleanRoleText}</em></div><div class="right"></div></div>
</div>`;
    }
  );
}

/**
 * Merges split date ranges in quad-details blocks
 */
export function mergeDateRanges(html) {
  return html
    .split('<div class="quad-details">')
    .map((block, index) => {
      if (index === 0) return block;

      const dateStart = block.indexOf('<span class="date">');
      const dateEnd = block.indexOf('</span>', dateStart);
      const roleStart = block.indexOf('<div class="left"><em>');
      const presentStart = block.indexOf('Present', roleStart);

      if (
        dateStart === -1 ||
        dateEnd === -1 ||
        roleStart === -1 ||
        presentStart === -1
      ) {
        return block;
      }

      const dateTag = '<span class="date">';
      const date = block.slice(dateStart + dateTag.length, dateEnd).trim();
      if (!date.endsWith('–')) return block;

      const updatedDate = `${block.slice(0, dateStart + dateTag.length)}${date} Present${block.slice(dateEnd)}`;
      const presentOffset = presentStart + (updatedDate.length - block.length);
      return `${updatedDate.slice(0, presentOffset)}${updatedDate.slice(presentOffset + 7).trimStart()}`;
    })
    .join('<div class="quad-details">');
}

/**
 * Processes Technical Skills section with sectionType macros
 */
export function processTechnicalSkills(html, sectionTypeMatches) {
  const rows = sectionTypeMatches
    .map((s) => {
      const label = s[1].trim().replaceAll(String.raw`\&`, '&');
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
    /<h2>Technical Skills<\/h2>[\s\S]*?(?=<h2>|$)/,
    `<h2>Technical Skills</h2><div class="resume-heading-list">${rows}</div>\n`
  );
}

/**
 * Processes resumeQuadHeading macros (for Education section)
 */
export function processQuadHeadings(html, quadHeadingMatches) {
  let idx = 0;

  return html.replace(
    /<span class="macro macro-resumeQuadHeading"><\/span>([\s\S]*?)(?=(<ul|<span|<\/div|<\/p|$))/g,
    (m, content) => {
      const parsed = quadHeadingMatches[idx++];

      if (!parsed || parsed.length < 5) {
        // If we don't have parsed arguments, return original
        return m;
      }

      const uni = parsed[1].trim();
      const loc = parsed[2].trim();
      const degree = parsed[3].trim();
      const dateRange = normalizeDateText(parsed[4]);

      return `
<div class="quad">
  <div class="row"><div class="left"><strong>${uni}</strong></div><div class="right">${loc}</div></div>
  <div class="row"><div class="left"><em>${degree}</em></div><div class="right"><em>${dateRange}</em></div></div>
</div>`;
    }
  );
}

/**
 * Converts custom list macros to semantic HTML lists
 */
export function processListMacros(html) {
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
      .filter(Boolean)
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
export function processHeadingListMacros(html) {
  return html
    .replaceAll(
      '<span class="macro macro-resumeHeadingListStart"></span>',
      '<div class="resume-heading-list">'
    )
    .replaceAll(
      '<span class="macro macro-resumeHeadingListEnd"></span>',
      '</div>'
    );
}

/**
 * Cleans up paragraph wrappers around block elements
 */
export function cleanupParagraphWrappers(html) {
  return html
    .replace(/<p>\s*(?=<div class="(?:resume-heading-list|contact|trio|quad|quad-details)">)/g, '')
    .replace(/<\/p>\s*(?=<div class="(?:resume-heading-list|contact|trio|quad|quad-details)">)/g, '')
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
    )
    .replace(
      /<p><small>([^<]*)<\/small><\/p>\s*([^<]*)\s*<ul class="resume-items">/g,
      (match, role, duplicate) =>
        role.trim() === duplicate.trim()
          ? `<p><small>${role}</small></p><ul class="resume-items">`
          : match
    )
    .replace(/<p>\s*<\/div>/g, '</div>');
}

/**
 * Applies final HTML cleanup and fixes
 */
export function applyFinalCleanups(html) {
  return (
    html
      // Fix missing spaces after percent symbols
      .replace(/(\d+)%([a-zA-Z])/g, '$1% $2')
      // Clean up leftover macro artifacts
      .replaceAll(
        '<span class="macro macro-uline"></span>Source Code</a>',
        ''
      )
      // Remove stray class="href" attributes
      .replaceAll('class="href"', '')
      // Fix double spaces in href attributes
      .replaceAll('<a  href=', '<a href=')
      // Remove the plain-text role emitted after project role paragraphs
      .replace(
        /(<p><small>([^<]+)<\/small><\/p>)\s*([^<]+)\s*<ul class="resume-items">/g,
        (match, roleBlock, role, duplicate) =>
          role === duplicate
            ? `${roleBlock}<ul class="resume-items">`
            : match
      )
      .replace(
        /(<div class="role"><em>([^<]+)<\/em><\/div>)\s*([^<]+)\s*<ul class="resume-items">/g,
        (match, roleBlock, role, duplicate) =>
          role === duplicate
            ? `${roleBlock}<ul class="resume-items">`
            : match
      )
      // Add target="_blank" to external links
      .replace(
        /<a href="(https?:\/\/[^"]+)"/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer"'
      )
      // Clean up duplicate target="_blank" attributes
      .replaceAll(
        'target="_blank" rel="noopener noreferrer" target="_blank" rel="noopener noreferrer"',
        'target="_blank" rel="noopener noreferrer"'
      )
  );
}

function normalizeWhitespace(text) {
  return text.split(/\s+/).filter(Boolean).join(' ');
}

function normalizeDateText(text) {
  return normalizeWhitespace(text.replaceAll('--', ' – '));
}
