import {
  toastTextStyles,
  toastTypeStyles,
  toastViewportClassName,
} from '../Toast';

describe('Toast', () => {
  test('does not let the empty viewport block footer clicks', () => {
    expect(toastViewportClassName).toContain('pointer-events-none');
    expect(toastViewportClassName).toContain('fixed');
    expect(toastViewportClassName).toContain('bottom-0');
    expect(toastViewportClassName).toContain('right-0');
  });

  test('uses design system status tokens instead of raw Tailwind colors', () => {
    expect(toastTypeStyles.error).toContain('status-error');
    expect(toastTypeStyles.error).not.toMatch(/\bred-\d{2,3}\b/);
    expect(toastTextStyles.error).toBe('text-status-error');

    expect(toastTypeStyles.success).toContain('status-success');
    expect(toastTypeStyles.success).not.toMatch(/\bgreen-\d{2,3}\b/);
    expect(toastTextStyles.success).toBe('text-status-success');

    expect(toastTypeStyles.warning).toContain('status-warning');
    expect(toastTypeStyles.warning).not.toMatch(/\byellow-\d{2,3}\b/);
    expect(toastTextStyles.warning).toBe('text-status-warning');
  });
});
