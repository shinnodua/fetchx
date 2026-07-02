import { describe, expect, test } from 'bun:test';

import { desktopDownloadButtonClassName } from '../AppFooter';

describe('AppFooter', () => {
  test('uses a comfortable press area for desktop download actions', () => {
    expect(desktopDownloadButtonClassName).toContain('min-h-10');
    expect(desktopDownloadButtonClassName).toContain('h-10');
    expect(desktopDownloadButtonClassName).toContain('relative');
    expect(desktopDownloadButtonClassName).toContain('z-10');
    expect(desktopDownloadButtonClassName).toContain('px-4');
    expect(desktopDownloadButtonClassName).toContain('text-sm');
    expect(desktopDownloadButtonClassName).not.toContain('h-7');
    expect(desktopDownloadButtonClassName).not.toContain('text-[11px]');
  });
});
