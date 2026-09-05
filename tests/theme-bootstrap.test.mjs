import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const indexTemplate = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const bootstrapMatch = indexTemplate.match(
  /<script id="theme-bootstrap">([\s\S]*?)<\/script>/,
);

function runBootstrap(storedValue, shouldThrow = false) {
  const root = {
    attributes: new Map(),
    setAttribute(name, value) {
      this.attributes.set(name, value);
    },
  };
  const localStorage = {
    getItem() {
      if (shouldThrow) {
        throw new Error('storage unavailable');
      }
      return storedValue;
    },
  };

  vm.runInNewContext(bootstrapMatch[1], {
    document: { documentElement: root },
    window: { localStorage },
  });

  return root.attributes;
}

test('restores only a saved dark preference before the client module', () => {
  assert.ok(bootstrapMatch, 'index.html must contain the theme bootstrap');

  const bootstrapStart = indexTemplate.indexOf('<script id="theme-bootstrap">');
  const mainStart = indexTemplate.indexOf('<script type="module" src="/src/main.js">');

  assert.ok(bootstrapStart >= 0 && bootstrapStart < mainStart);
  assert.match(bootstrapMatch[1], /try\s*\{/);
  assert.match(bootstrapMatch[1], /localStorage/);
  assert.match(bootstrapMatch[1], /resume-theme/);
  assert.match(bootstrapMatch[1], /===\s*['"]dark['"]/);
  assert.doesNotMatch(bootstrapMatch[1], /matchMedia|prefers-color-scheme/);

  assert.equal(runBootstrap('dark').get('data-theme'), 'dark');
  assert.equal(runBootstrap('light').has('data-theme'), false);
  assert.equal(runBootstrap('sepia').has('data-theme'), false);
});

test('continues with the light baseline when storage access throws', () => {
  assert.doesNotThrow(() => runBootstrap(null, true));
  assert.equal(runBootstrap(null, true).has('data-theme'), false);
});

test('synchronizes the injected appearance control before the client module', () => {
  const syncStart = indexTemplate.indexOf('const themeToggle = document.querySelector');
  const mainStart = indexTemplate.indexOf('<script type="module" src="/src/main.js">');

  assert.ok(syncStart >= 0 && syncStart < mainStart);
  assert.match(indexTemplate, /if\s*\(themeToggle\)/);
  assert.match(indexTemplate, /aria-pressed/);
  assert.match(indexTemplate, /Switch to \$\{nextThemeLabel\} mode/);
});
