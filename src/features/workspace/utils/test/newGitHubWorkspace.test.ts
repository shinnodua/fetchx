import { describe, expect, test } from 'bun:test';
import { createEmptyGitHubWorkspaceCollections } from '../newGitHubWorkspace';

describe('new GitHub workspace', () => {
  test('starts every newly created repository workspace without collections', () => {
    const firstWorkspace = createEmptyGitHubWorkspaceCollections();
    const secondWorkspace = createEmptyGitHubWorkspaceCollections();

    expect(firstWorkspace).toEqual([]);
    expect(secondWorkspace).toEqual([]);
    expect(firstWorkspace).not.toBe(secondWorkspace);
  });
});
