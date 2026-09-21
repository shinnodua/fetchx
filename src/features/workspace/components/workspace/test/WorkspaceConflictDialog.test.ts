import { describe, expect, test } from 'bun:test';
import { managementDialogClassName } from '../../shared/ManagementDialog';
import { conflictListClassName } from '../WorkspaceConflictDialog';

describe('WorkspaceConflictDialog layout', () => {
  test('uses the shared full-screen dialog shell', () => {
    expect(managementDialogClassName).toContain('w-[calc(100vw-2rem)]');
    expect(managementDialogClassName).toContain('max-w-none');
  });

  test('keeps the conflict list as the dedicated scroll region', () => {
    expect(conflictListClassName).toContain('h-0');
    expect(conflictListClassName).toContain('flex-1');
    expect(conflictListClassName).toContain('overflow-y-auto');
    expect(conflictListClassName).toContain('overscroll-contain');
  });
});
