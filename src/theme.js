export const THEMES = Object.freeze({
  DARK: 'dark',
  LIGHT: 'light',
});

export const THEME_ATTRIBUTE = 'data-theme';
export const THEME_STORAGE_KEY = 'resume-theme';

function normalizeTheme(theme) {
  return theme === THEMES.DARK ? THEMES.DARK : THEMES.LIGHT;
}

export function persistTheme(storage, theme) {
  if (!storage) {
    return false;
  }

  try {
    storage.setItem(THEME_STORAGE_KEY, normalizeTheme(theme));
    return true;
  } catch {
    return false;
  }
}

export function getBrowserStorage(globalObject = globalThis) {
  try {
    return globalObject?.localStorage ?? null;
  } catch {
    return null;
  }
}

export function getThemeFromRoot(root) {
  return normalizeTheme(root?.getAttribute(THEME_ATTRIBUTE));
}

export function applyTheme(root, theme) {
  const nextTheme = normalizeTheme(theme);

  if (!root) {
    return nextTheme;
  }

  if (nextTheme === THEMES.DARK) {
    root.setAttribute(THEME_ATTRIBUTE, THEMES.DARK);
  } else {
    root.removeAttribute(THEME_ATTRIBUTE);
  }

  return nextTheme;
}

export function setTheme(root, storage, theme) {
  const nextTheme = applyTheme(root, theme);

  return {
    persisted: persistTheme(storage, nextTheme),
    theme: nextTheme,
  };
}
