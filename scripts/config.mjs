/**
 * Configuration constants for LaTeX to HTML conversion
 */

export const CONFIG = {
  latexDir: './latex',
  outputDir: './public/converted-docs',
  manifestFile: './public/documents-manifest.json',
};

export const ICON_MAP = {
  faLinkedin: 'fab fa-linkedin',
  faGithub: 'fab fa-github',
  faEnvelope: 'fas fa-envelope',
  faMobile: 'fas fa-mobile',
};

export const LIST_MARKERS = {
  start: '<span class="macro macro-resumeItemListStart"></span>',
  end: '<span class="macro macro-resumeItemListEnd"></span>',
  item: '<span class="macro macro-resumeItem"></span>',
};
