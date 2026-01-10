/**
 * HTML template and CSS styles
 */

/**
 * Returns the CSS styles for the HTML document
 */
export function getStyles() {
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
        © ${currentYear} Tsou, Dong-You. Licensed under <a href="https://github.com/dytsou/resume/blob/main/LICENSE" target="_blank" rel="noopener">MIT License</a>
    </div>
</body>
</html>`;
}
