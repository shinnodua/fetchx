import { describe, expect, test } from 'bun:test';
import { alertVariantClassNames } from '../Alert';

describe('Alert', () => {
  test('uses design system semantic status tokens instead of raw Tailwind colors', () => {
    expect(alertVariantClassNames.destructive).toContain('status-error');
    expect(alertVariantClassNames.destructive).not.toMatch(/\bred-\d{2,3}\b/);

    expect(alertVariantClassNames.success).toContain('status-success');
    expect(alertVariantClassNames.success).not.toMatch(/\bgreen-\d{2,3}\b/);

    expect(alertVariantClassNames.warning).toContain('status-warning');
    expect(alertVariantClassNames.warning).not.toMatch(/\byellow-\d{2,3}\b/);
  });
});
