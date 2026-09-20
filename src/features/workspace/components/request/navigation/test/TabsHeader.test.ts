import { describe, expect, test } from 'bun:test';
import { workspaceChangeTextClassNames } from '../../../workspaceChangeStatusClassNames';
import { workspaceTabClassName } from '../TabsHeader';

describe('TabsHeader', () => {
  test('uses compact typography and height for workspace tabs', () => {
    expect(workspaceTabClassName).toContain('h-8');
    expect(workspaceTabClassName).toContain('text-[11px]');
    expect(workspaceTabClassName).not.toContain('text-xs');
  });

  test('keeps tabs visually ready for pointer-driven reordering', () => {
    expect(workspaceTabClassName).toContain('transition-all');
    expect(workspaceTabClassName).toContain('relative');
  });

  test('shares GitHub change colors with the collection sidebar', () => {
    expect(workspaceChangeTextClassNames.added).toBe('text-status-added');
    expect(workspaceChangeTextClassNames.modified).toBe('text-status-modified');
  });
});
