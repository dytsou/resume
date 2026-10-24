import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('CI build job installs TeX before build and requires certified convert', () => {
  const workflow = readFileSync('.github/workflows/ci.yml', 'utf8');
  assert.match(
    workflow,
    /zauguin\/install-texlive@[0-9a-f]{40}/
  );
  assert.match(workflow, /package_file:\s*scripts\/tex\/tl_packages/);
  assert.match(workflow, /CONVERT_REQUIRE_CERTIFIED:\s*'1'/);
  const installIdx = workflow.indexOf('Install TeX Live');
  const buildIdx = workflow.indexOf('Build project');
  assert.ok(installIdx > 0 && buildIdx > installIdx);
});
