/**
 * Normalize lwarp HTML for static hosting under /resume/converted-docs/
 */
export function postprocessHtml(html, { baseHref = './' } = {}) {
  let out = html;
  // lwarp may emit relative CSS links; keep sibling asset paths stable
  out = out.replace(/href="([^"]+\.css)"/g, (_, css) => {
    if (css.startsWith('http')) return `href="${css}"`;
    return `href="${baseHref}${css.replace(/^\.\//, '')}"`;
  });
  return out;
}
