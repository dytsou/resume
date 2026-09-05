import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const mainSource = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const themeSource = readFileSync(new URL('../src/theme.js', import.meta.url), 'utf8');
const themeModuleUrl = `data:text/javascript;base64,${Buffer.from(themeSource).toString('base64')}`;

function createElement() {
  const attributes = new Map();
  const listeners = new Map();

  return {
    textContent: '',
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    click() {
      listeners.get('click')?.();
    },
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

async function loadMain({ initialTheme, storage }) {
  const root = createElement();
  const toggle = createElement();

  if (initialTheme === 'dark') {
    root.setAttribute('data-theme', 'dark');
  }

  const document = {
    documentElement: root,
    querySelector(selector) {
      return selector === '.theme-toggle' ? toggle : null;
    },
  };
  const window = { localStorage: storage, setTimeout() {} };
  const previousGlobals = new Map(
    ['document', 'window', 'localStorage'].map((name) => [
      name,
      Object.getOwnPropertyDescriptor(globalThis, name),
    ]),
  );

  Object.assign(globalThis, { document, window, localStorage: storage });

  const source = mainSource
    .replace("import './index.css';", '')
    .replace("from './theme.js';", `from '${themeModuleUrl}';`);

  try {
    await import(`data:text/javascript;base64,${Buffer.from(`${source}\n// ${crypto.randomUUID()}`).toString('base64')}`);
    return { root, toggle };
  } finally {
    for (const [name, descriptor] of previousGlobals) {
      if (descriptor) {
        Object.defineProperty(globalThis, name, descriptor);
      } else {
        delete globalThis[name];
      }
    }
  }
}

function assertToggleState({ root, toggle }, theme) {
  const nextThemeLabel = theme === 'dark' ? 'light' : 'dark';

  assert.equal(root.getAttribute('data-theme'), theme === 'dark' ? 'dark' : null);
  assert.equal(toggle.getAttribute('aria-pressed'), String(theme === 'dark'));
  assert.equal(toggle.getAttribute('aria-label'), `Switch to ${nextThemeLabel} mode`);
  assert.equal(toggle.textContent, `Switch to ${nextThemeLabel} mode`);
}

function createStorage({ throwsOnWrite = false } = {}) {
  let value = null;

  return {
    getItem(key) {
      assert.equal(key, 'resume-theme');
      return value;
    },
    setItem(key, nextValue) {
      assert.equal(key, 'resume-theme');
      if (throwsOnWrite) {
        throw new Error('storage unavailable');
      }
      value = nextValue;
    },
  };
}

test('main initializes either bootstrap theme and persists two toggle transitions', async () => {
  for (const initialTheme of ['light', 'dark']) {
    const storage = createStorage();
    const page = await loadMain({ initialTheme, storage });
    const firstTheme = initialTheme === 'dark' ? 'light' : 'dark';

    assertToggleState(page, initialTheme);
    page.toggle.click();
    assertToggleState(page, firstTheme);
    assert.equal(storage.getItem('resume-theme'), firstTheme);

    page.toggle.click();
    assertToggleState(page, initialTheme);
    assert.equal(storage.getItem('resume-theme'), initialTheme);
  }
});

test('main keeps the root and toggle usable when theme storage rejects writes', async () => {
  const storage = createStorage({ throwsOnWrite: true });
  const page = await loadMain({ initialTheme: 'dark', storage });

  page.toggle.click();
  assertToggleState(page, 'light');
  assert.equal(storage.getItem('resume-theme'), null);

  page.toggle.click();
  assertToggleState(page, 'dark');
  assert.equal(storage.getItem('resume-theme'), null);
});
