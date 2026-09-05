import './index.css';

import {
  getBrowserStorage,
  getThemeFromRoot,
  setTheme,
  THEMES,
} from './theme.js';

const root = document.documentElement;
const themeToggle = document.querySelector('.theme-toggle');

if (themeToggle) {
  const storage = getBrowserStorage();

  const syncThemeToggle = () => {
    const theme = getThemeFromRoot(root);
    const isDark = theme === THEMES.DARK;

    themeToggle.setAttribute('aria-pressed', String(isDark));
    themeToggle.textContent = isDark ? 'Light mode' : 'Dark mode';
  };

  syncThemeToggle();
  themeToggle.addEventListener('click', () => {
    const currentTheme = getThemeFromRoot(root);
    const nextTheme =
      currentTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;

    setTheme(root, storage, nextTheme);
    syncThemeToggle();
  });
}

const downloadButton = document.querySelector('.download-drive-button');

if (downloadButton) {
  downloadButton.addEventListener('click', () => {
    downloadButton.setAttribute('aria-busy', 'true');
    window.setTimeout(() => downloadButton.removeAttribute('aria-busy'), 500);
  });
}
