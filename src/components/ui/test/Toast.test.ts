import { describe, expect, test } from 'bun:test';

import { toastViewportClassName } from '../Toast';

describe('Toast', () => {
  test('does not let the empty viewport block footer clicks', () => {
    expect(toastViewportClassName).toContain('pointer-events-none');
    expect(toastViewportClassName).toContain('fixed');
    expect(toastViewportClassName).toContain('bottom-0');
    expect(toastViewportClassName).toContain('right-0');
  });
});
