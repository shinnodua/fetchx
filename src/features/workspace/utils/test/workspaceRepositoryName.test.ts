import { describe, expect, test } from 'bun:test';
import { getWorkspaceNameFromRepository } from '../workspaceRepositoryName';

describe('getWorkspaceNameFromRepository', () => {
  test('uses only the repository name from an owner and repository path', () => {
    expect(getWorkspaceNameFromRepository('fetchx/api-workspace')).toBe(
      'api-workspace',
    );
  });

  test('removes trailing separators and a git suffix', () => {
    expect(getWorkspaceNameFromRepository('fetchx/api-workspace.git/')).toBe(
      'api-workspace',
    );
  });
});
