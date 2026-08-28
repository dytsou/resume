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

export function createStaticIndex(template, resumeHtml, driveLink = '') {
  const body = extractSection(resumeHtml, 'body');
  const assets = extractHeadAssets(resumeHtml);
  const styles = extractStyles(resumeHtml);
  const directDownloadLink = toDirectDownloadLink(driveLink);
  const downloadButton = directDownloadLink
    ? `<div class="download-button-wrapper"><a class="download-drive-button" href="${directDownloadLink.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}" download="resume.pdf" aria-label="Download Resume">Download Resume</a></div>`
    : '';

  return template
    .replace('<!-- RESUME_ASSETS -->', assets)
    .replace('<!-- RESUME_STYLES -->', styles)
    .replace('<!-- RESUME_CONTENT -->', body)
    .replace('<!-- DOWNLOAD_BUTTON -->', downloadButton);
}
