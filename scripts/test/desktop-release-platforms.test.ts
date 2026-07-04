import { describe, expect, test } from 'bun:test';
import {
  getBuildTargets,
  isReleasePlatform,
  REQUIRED_PLATFORMS,
} from '../desktop-release-platforms.ts';

describe('desktop release platforms', () => {
  test('supports Apple Silicon macOS and Windows x64 release artifacts', () => {
    expect(REQUIRED_PLATFORMS).toEqual(['darwin-aarch64', 'windows-x86_64']);
  });

  test('builds macOS releases for Apple Silicon only', () => {
    expect(getBuildTargets('darwin')).toEqual([
      {
        bundles: 'app,dmg',
        platform: 'darwin-aarch64',
        target: 'aarch64-apple-darwin',
      },
    ]);
  });

  test('builds Windows releases for x64 NSIS', () => {
    expect(getBuildTargets('win32')).toEqual([
      {
        bundles: 'nsis',
        platform: 'windows-x86_64',
        target: 'x86_64-pc-windows-msvc',
      },
    ]);
  });

  test('identifies supported release platform fragments', () => {
    expect(isReleasePlatform('darwin-aarch64')).toBe(true);
    expect(isReleasePlatform('windows-x86_64')).toBe(true);
    expect(isReleasePlatform('darwin-x86_64')).toBe(false);
    expect(isReleasePlatform('stable')).toBe(false);
  });
});
