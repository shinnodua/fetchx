import { describe, expect, test } from 'bun:test';
import { workspaceTabClassName } from '../TabsHeader';

describe('TabsHeader', () => {
  test('uses compact typography and height for workspace tabs', () => {
    expect(workspaceTabClassName).toContain('h-8');
    expect(workspaceTabClassName).toContain('text-[11px]');
    expect(workspaceTabClassName).not.toContain('text-xs');
  });
});
