/**
 * HTML template and CSS styles
 */

/**
 * Returns the CSS styles for the HTML document
 */
export function getStyles() {
  return `
    @page {
      size: A4 portrait;
      margin: 0;
    }
    html, body {
      background: #faf8f2;
      margin: 0;
      padding: 0;
    }
    .resume-page {
      width: 100%;
      max-width: 210mm;
      margin: 0 auto;
      padding: 2.5rem 1.7rem 1.7rem;
      font-family: "Source Sans Pro", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
      font-size: 13px;
      line-height: 1.2;
      letter-spacing: -0.015em;
      color: #000;
      background: #fff;
      box-sizing: border-box;
      border: 1px solid #d1d5db;
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.08);
    }
    * { box-sizing: border-box; }
    h1, h2, h3, h4, h5, h6 {
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      font-weight: bold;
    }
    h1 { font-size: 2rem; line-height: 1.1; text-align: center; }
    h2 {
      font-size: 1rem;
      line-height: 1.2;
      font-variant: small-caps;
      font-family: "Public Sans", "Source Sans Pro", system-ui, sans-serif;
      color: #0000ff;
      border-bottom: 1px solid #222;
      padding-bottom: 0.2rem;
      margin-top: 1rem;
      margin-bottom: 0.4rem;
    }
    h3 { font-size: 1.2em; }
    .author { text-align: center; font-style: italic; margin: 1em 0; }
    .date { text-align: center; margin-bottom: 2em; }
    .title { margin: 0; }
    p { margin: 0.2rem 0; text-align: left; }
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
    a { color: #000; text-decoration: none; cursor: pointer; }
    a:hover, a:visited { color: #000; }
    .resume-items { margin: 0.2rem 0 0.4rem 1rem; padding-left: 0.5rem; }
    .resume-items li { margin: 0.1rem 0; padding-left: 0.05rem; }
    .resume-heading-list { margin: 0.15rem 0 0.35rem 0.95rem; }
    .contact { display: block; text-align: center; margin-bottom: 0.8rem; }
    .contact.centered { grid-template-columns: 1fr; text-align: center; }
    .contact.centered .contact-name { justify-self: center; }
    .contact.centered .contact-links { justify-self: center; }
    .contact-name { font-size: 2rem; line-height: 1.1; font-weight: 700; }
    .contact-links { color: #111; display: flex; flex-wrap: wrap; justify-content: center; gap: 0.75rem; align-items: center; margin-top: 0.65rem; }
    .contact-links a { display: inline-flex; align-items: center; gap: 0.25rem; }
    .contact-links a, .trio-link a { text-decoration: underline; }
    .contact-links i {
      color: #000;
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
    .role { font-size: 0.85rem; line-height: 1.25; white-space: nowrap; }
    .role em { font-style: italic; }
    .quad, .quad-details { margin: 0.25rem 0; }
    .row { display: grid; grid-template-columns: 1fr auto; align-items: baseline; }
    .row .left, .row .right { white-space: nowrap; }
    .row .right { text-align: right; color: #000; }
    .skill-row { display: grid; grid-template-columns: 180px 1fr; align-items: start; gap: 0.5rem; }
    .skill-label { font-weight: 700; white-space: nowrap; }
    .skill-content { white-space: normal; overflow-wrap: normal; word-break: normal; }
    .skill-sep { display: none; }
    .skill-sep { text-align: center; }
    .macro { display: none; }
    .converter-footer {
      width: 100%;
      max-width: 210mm;
      margin: 1.25rem auto 1.5rem;
      text-align: center;
      font-size: 0.75rem;
      line-height: 1.35;
      font-family: "Source Sans Pro", system-ui, sans-serif;
      color: #6b7280;
    }
    .converter-footer a { color: #6b7280; text-decoration: underline; }
    .converter-footer a:hover { text-decoration: underline; }

    @media (max-width: 768px) {
      html, body { background: #faf8f2; }
      .resume-page {
        border: 0;
        box-shadow: none;
        padding: 2rem 1rem 1rem;
      }
      h1 { font-size: 2rem; }
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
      .skill-content { white-space: normal; overflow-wrap: normal; word-break: normal; }
      .contact { grid-template-columns: 1fr; gap: 0.5rem; }
      .contact-right { text-align: left; white-space: normal; }
    }

    @media (max-width: 480px) {
      body { padding: 0.75rem; }
      h1 { font-size: 1.8rem; }
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
export function wrapInHtmlTemplate(content, metadata) {
  const currentYear = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${metadata.title}</title>
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Source+Sans+Pro:ital,wght@0,200;0,300;0,400;0,600;0,700;0,900;1,200;1,300;1,400;1,600;1,700;1,900&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Public+Sans:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&display=swap" rel="stylesheet">
    <!-- Font Awesome 6.5.2 - Primary CDN -->
    <link rel="stylesheet" href="https://use.fontawesome.com/releases/v6.5.2/css/all.css" integrity="sha384-B4dIYHKNBt8Bc12p+WXckhzcICo0wtJAoU8YZTY5qE0Id1GSseTk6S+L3BlXeVIU" crossorigin="anonymous" />
    <!-- Font Awesome Fallback CDN -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <style>${getStyles()}</style>
</head>
<body>
    <main class="resume-page">${content}</main>
    <div class="converter-footer">
        Generated with <a href="https://github.com/dytsou/resume" target="_blank" rel="noopener">LaTeX to HTML Converter</a><br>
        © ${currentYear} Tsou, Dong-You. Licensed under <a href="https://github.com/dytsou/resume/blob/main/LICENSE" target="_blank" rel="noopener">MIT License</a>
    </div>
</body>
</html>`;
}
