import { describe, expect, test } from 'bun:test';

import { AppFooter, desktopDownloadButtonClassName } from '../AppFooter';

describe('AppFooter', () => {
  test('exports AppFooter component', () => {
    expect(typeof AppFooter).toBe('function');
  });

  test('uses the compact action scale for desktop download actions', () => {
    expect(desktopDownloadButtonClassName).toContain('min-h-8');
    expect(desktopDownloadButtonClassName).toContain('h-8');
    expect(desktopDownloadButtonClassName).toContain('relative');
    expect(desktopDownloadButtonClassName).toContain('z-10');
    expect(desktopDownloadButtonClassName).toContain('px-3');
    expect(desktopDownloadButtonClassName).toContain('text-xs');
    expect(desktopDownloadButtonClassName).not.toContain('h-7');
    expect(desktopDownloadButtonClassName).not.toContain('text-[11px]');
  });
});
