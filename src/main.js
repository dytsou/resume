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

  const syncThemeToggle = (theme = getThemeFromRoot(root)) => {
    const isDark = theme === THEMES.DARK;
    const nextThemeLabel = isDark ? 'light' : 'dark';

    themeToggle.setAttribute('aria-pressed', String(isDark));
    themeToggle.setAttribute('aria-label', `Switch to ${nextThemeLabel} mode`);
    themeToggle.textContent = `Switch to ${nextThemeLabel} mode`;
  };

  syncThemeToggle();
  themeToggle.addEventListener('click', () => {
    const currentTheme = getThemeFromRoot(root);
    const nextTheme = currentTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;

    const { theme } = setTheme(root, storage, nextTheme);
    syncThemeToggle(theme);
  });
}

const downloadButton = document.querySelector('.download-drive-button');

if (downloadButton) {
  downloadButton.addEventListener('click', () => {
    downloadButton.setAttribute('aria-busy', 'true');
    window.setTimeout(() => downloadButton.removeAttribute('aria-busy'), 500);
  });
}
