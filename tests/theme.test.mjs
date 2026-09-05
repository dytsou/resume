import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applyTheme,
  getBrowserStorage,
  getThemeFromRoot,
  persistTheme,
  setTheme,
  THEME_ATTRIBUTE,
  THEME_STORAGE_KEY,
  THEMES,
} from '../src/theme.js';

function createRoot() {
  const attributes = new Map();

  return {
    getAttribute(name) {
      return attributes.get(name) ?? null;
    },
    removeAttribute(name) {
      attributes.delete(name);
    },
    setAttribute(name, value) {
      attributes.set(name, value);
    },
  };
}

function createStorage() {
  return {
    setItem(key, nextValue) {
      assert.equal(key, THEME_STORAGE_KEY);
      this.value = nextValue;
    },
  };
}

test('applies light and dark state to the document root', () => {
  const root = createRoot();

  assert.equal(applyTheme(root, THEMES.DARK), THEMES.DARK);
  assert.equal(root.getAttribute(THEME_ATTRIBUTE), THEMES.DARK);
  assert.equal(getThemeFromRoot(root), THEMES.DARK);

  assert.equal(applyTheme(root, THEMES.LIGHT), THEMES.LIGHT);
  assert.equal(root.getAttribute(THEME_ATTRIBUTE), null);
  assert.equal(getThemeFromRoot(root), THEMES.LIGHT);
});

test('persists both explicit choices', () => {
  const storage = createStorage();

  assert.equal(persistTheme(storage, THEMES.DARK), true);
  assert.equal(storage.value, THEMES.DARK);
  assert.equal(persistTheme(storage, THEMES.LIGHT), true);
  assert.equal(storage.value, THEMES.LIGHT);
});

test('a write failure keeps the newly applied root state usable', () => {
  const root = createRoot();
  const storage = {
    setItem() {
      throw new Error('storage unavailable');
    },
  };

  const result = setTheme(root, storage, THEMES.DARK);

  assert.deepEqual(result, { persisted: false, theme: THEMES.DARK });
  assert.equal(getThemeFromRoot(root), THEMES.DARK);
});

test('browser storage access is defensive', () => {
  assert.equal(getBrowserStorage({}), null);
  assert.equal(
    getBrowserStorage({
      get localStorage() {
        throw new Error('storage unavailable');
      },
    }),
    null,
  );
});
