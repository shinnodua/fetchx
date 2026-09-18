import { describe, expect, test } from 'bun:test';
import { workspaceRequestTitleClassName } from '../ActiveRequestWorkspace';

describe('ActiveRequestWorkspace', () => {
  test('uses the compact title scale for editable request names', () => {
    expect(workspaceRequestTitleClassName).toContain('text-base');
    expect(workspaceRequestTitleClassName).not.toContain('text-lg');
  });
});
