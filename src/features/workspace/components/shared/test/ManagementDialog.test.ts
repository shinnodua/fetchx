import { describe, expect, test } from 'bun:test';
import { managementDialogClassName } from '../ManagementDialog';

describe('ManagementDialog', () => {
  test('uses the shared full-viewport management layout', () => {
    expect(managementDialogClassName).toContain('h-[calc(100vh-2rem)]');
    expect(managementDialogClassName).toContain('w-[calc(100vw-2rem)]');
    expect(managementDialogClassName).toContain('max-w-none');
  });
});
