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

export function createStaticIndex(template, resumeHtml, driveLink = '', seo = {}) {
  const body = extractSection(resumeHtml, 'body');
  const assets = extractHeadAssets(resumeHtml);
  const styles = extractStyles(resumeHtml);
  const directDownloadLink = toDirectDownloadLink(driveLink);
  const downloadIcon = `<span class="button-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></span>`;
  const downloadButton = directDownloadLink
    ? `<div class="download-button-wrapper"><a class="download-drive-button" href="${directDownloadLink.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}" download="resume.pdf" aria-label="Download Resume">${downloadIcon}</a></div>`
    : '';

  const title = seo.title ?? `${seo.name} — Resume`;
  const description = seo.description ?? '';
  const ogTitle = seo.ogTitle ?? title;
  const ogDescription = seo.ogDescription ?? description;
  const ogType = seo.ogType ?? 'profile';
  const ogUrl = seo.ogUrl ?? seo.url ?? '';
  const canonicalUrl = seo.canonicalUrl ?? '';

  return template
    .replace('<!-- SEO_TITLE -->', `<title>${title}</title>`)
    .replace('<!-- SEO_DESCRIPTION -->', `<meta name="description" content="${description}" />`)
    .replace('<!-- SEO_CANONICAL -->', canonicalUrl ? `<link rel="canonical" href="${canonicalUrl}" />` : '')
    .replace('<!-- SEO_OG_TITLE -->', `<meta property="og:title" content="${ogTitle}" />`)
    .replace('<!-- SEO_OG_DESCRIPTION -->', `<meta property="og:description" content="${ogDescription}" />`)
    .replace('<!-- SEO_OG_TYPE -->', `<meta property="og:type" content="${ogType}" />`)
    .replace('<!-- SEO_OG_URL -->', `<meta property="og:url" content="${ogUrl}" />`)
    .replace('<!-- RESUME_ASSETS -->', assets)
    .replace('<!-- RESUME_STYLES -->', styles)
    .replace('<!-- RESUME_CONTENT -->', body)
    .replace('<!-- DOWNLOAD_BUTTON -->', downloadButton);
}
