import { describe, expect, test } from 'bun:test';
import { desktopUpdateButtonClassName } from '../DesktopUpdateManager';

describe('DesktopUpdateManager', () => {
  test('uses the compact action scale suited for the bottom bar without header margins', () => {
    expect(desktopUpdateButtonClassName).toContain('min-h-8');
    expect(desktopUpdateButtonClassName).toContain('h-8');
    expect(desktopUpdateButtonClassName).toContain('relative');
    expect(desktopUpdateButtonClassName).toContain('z-10');
    expect(desktopUpdateButtonClassName).toContain('px-3');
    expect(desktopUpdateButtonClassName).toContain('text-xs');
    expect(desktopUpdateButtonClassName).not.toContain('mb-1');
  });
});
