function extractSection(source, tagName) {
  const match = new RegExp(
    String.raw`<${tagName}[^>]*>([\s\S]*?)</${tagName}>`,
    'i'
  ).exec(
    source
  );
  return match?.[1]?.trim() ?? '';
}

function extractStyles(source) {
  return [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)]
    .map((match) => `<style>${match[1]}</style>`)
    .join('\n');
}

function extractHeadAssets(source) {
  const head = extractSection(source, 'head');
  return [
    ...head.matchAll(/<link\b[^>]*>/gi),
    ...head.matchAll(/<script\b[^>]*>[\s\S]*?<\/script(?:\s[^>]*)?>/gi),
  ]
    .map((match) => match[0])
    .join('\n');
}

function toDirectDownloadLink(link) {
  const trimmedLink = link.trim();
  const fileId =
    /\/file\/d\/([a-zA-Z0-9_-]+)/.exec(trimmedLink)?.[1] ??
    /[?&]id=([a-zA-Z0-9_-]+)/.exec(trimmedLink)?.[1] ??
    (/^[a-zA-Z0-9_-]+$/.test(trimmedLink) ? trimmedLink : null);

  return fileId ? `https://drive.google.com/uc?export=download&id=${fileId}` : null;
}

const themeToggle = `<div class="theme-control">
            <button type="button" class="theme-toggle" aria-pressed="false" aria-label="Switch to dark mode">Switch to dark mode</button>
        </div>`;

function injectThemeToggle(body) {
  const footerPattern =
    /(<div\b[^>]*class=["'][^"']*\bconverter-footer\b[^"']*["'][^>]*>)([\s\S]*?)(<\/div>)/i;
  const footerMatch = footerPattern.exec(body);

  if (!footerMatch || body.includes('class="theme-toggle"')) {
    return body;
  }

  return body.replace(
    footerPattern,
    (_, openingTag, footerContent, closingTag) =>
      `${openingTag}\n        ${themeToggle}${footerContent}${closingTag}`,
  );
}

export function createStaticIndex(template, resumeHtml, driveLink = '') {
  const body = injectThemeToggle(extractSection(resumeHtml, 'body'));
  const assets = extractHeadAssets(resumeHtml);
  const styles = extractStyles(resumeHtml);
  const directDownloadLink = toDirectDownloadLink(driveLink);
  const downloadIcon = `<span class="button-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></span>`;
  const downloadButton = directDownloadLink
    ? `<div class="download-button-wrapper"><a class="download-drive-button" href="${directDownloadLink.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}" download="resume.pdf" aria-label="Download Resume">${downloadIcon}</a></div>`
    : '';

  return template
    .replace('<!-- RESUME_ASSETS -->', assets)
    .replace('<!-- RESUME_STYLES -->', styles)
    .replace('<!-- RESUME_CONTENT -->', body)
    .replace('<!-- DOWNLOAD_BUTTON -->', downloadButton);
}
