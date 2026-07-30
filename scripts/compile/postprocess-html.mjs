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
  // ponytail: css:S4649 — icon stacks need a generic family
  out = out.replace(
    /font-family:\s*"Font Awesome 6 Brands"(?!,\s*sans-serif)/g,
    'font-family: "Font Awesome 6 Brands", sans-serif',
  );
  out = out.replace(
    /font-family:\s*"Font Awesome 6 Free",\s*"Font Awesome 6 Brands",\s*"Font Awesome 6 Pro"(?!,\s*sans-serif)/g,
    'font-family: "Font Awesome 6 Free", "Font Awesome 6 Brands", "Font Awesome 6 Pro", sans-serif',
  );
  return out;
}
