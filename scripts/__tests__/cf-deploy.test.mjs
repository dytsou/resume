import { describe, expect, it } from 'vitest';

import { previewAlias, resolveReleaseMode } from '../cf-deploy.mjs';

describe('cf-deploy release mode', () => {
  it('deploys production only on main', () => {
    expect(resolveReleaseMode({ branch: 'main' }).mode).toBe('production');
    expect(resolveReleaseMode({ branch: 'feat/x' }).mode).toBe('snapshot');
    expect(resolveReleaseMode({ branch: '' }).mode).toBe('snapshot');
  });

  it('honors explicit flags', () => {
    expect(
      resolveReleaseMode({ branch: 'feat/x', forceProduction: true }).mode
    ).toBe('production');
    expect(
      resolveReleaseMode({ branch: 'main', forceSnapshot: true }).mode
    ).toBe('snapshot');
    expect(() =>
      resolveReleaseMode({ forceProduction: true, forceSnapshot: true })
    ).toThrow(/only one/);
  });

  it('sanitizes preview aliases', () => {
    expect(previewAlias('feat/lwarp-tex')).toBe('feat-lwarp-tex');
  });
});
