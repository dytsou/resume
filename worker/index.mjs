import { convertToMarkdown, estimateTokens } from './markdown.mjs';

const MARKDOWN_CONTENT_TYPE = 'text/markdown; charset=utf-8';

const PRESERVED_HEADERS = [
  'strict-transport-security',
  'content-security-policy',
  'x-frame-options',
  'x-content-type-options',
  'access-control-allow-origin',
  'cache-control',
  'link',
  'set-cookie',
];

function wantsMarkdown(request) {
  const accept = request.headers.get('accept');
  return Boolean(accept && accept.toLowerCase().includes('text/markdown'));
}

function isHtml(response) {
  const contentType = response.headers.get('content-type') ?? '';
  return contentType.includes('text/html');
}

function passthroughHeaders(assetResponse) {
  const headers = new Headers(assetResponse.headers);
  headers.append('vary', 'accept');
  return headers;
}

function markdownHeaders(assetResponse, markdown, originalHtml) {
  const headers = new Headers();
  for (const name of PRESERVED_HEADERS) {
    const value = assetResponse.headers.get(name);
    if (value !== null) headers.set(name, value);
  }
  headers.set('content-type', MARKDOWN_CONTENT_TYPE);
  headers.set('vary', 'accept');
  headers.set('x-markdown-tokens', String(estimateTokens(markdown)));
  headers.set('x-original-tokens', String(estimateTokens(originalHtml)));
  headers.set('content-signal', 'ai-train=yes, search=yes, ai-input=yes');
  return headers;
}

export default {
  async fetch(request, env) {
    const assetResponse = await env.ASSETS.fetch(request);

    if (!wantsMarkdown(request) || !isHtml(assetResponse)) {
      return new Response(assetResponse.body, {
        status: assetResponse.status,
        headers: passthroughHeaders(assetResponse),
      });
    }

    const html = await assetResponse.text();
    const { markdown } = await convertToMarkdown(html);

    return new Response(markdown, {
      status: assetResponse.status,
      headers: markdownHeaders(assetResponse, markdown, html),
    });
  },
};
