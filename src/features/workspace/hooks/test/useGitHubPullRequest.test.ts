import { describe, expect, test } from 'bun:test';
import {
  getGitHubPullRequestError,
  getPullRequestSessionToken,
  getWorkspaceGitHubCredentialKey,
} from '../useGitHubPullRequest';

describe('useGitHubPullRequest credential handling', () => {
  test('reuses a validated token only for the workspace that loaded it', () => {
    const session = { workspaceId: 'workspace-1', token: 'validated-token' };

    expect(getPullRequestSessionToken(session, 'workspace-1')).toBe(
      'validated-token',
    );
    expect(getPullRequestSessionToken(session, 'workspace-2')).toBeNull();
    expect(getPullRequestSessionToken(null, 'workspace-1')).toBeNull();
  });

  test('prefers the workspace credential key over stale connection metadata', () => {
    expect(
      getWorkspaceGitHubCredentialKey(
        'connection.workspace',
        'connection.stale',
        'connect',
      ),
    ).toBe('connection.workspace');
    expect(
      getWorkspaceGitHubCredentialKey(undefined, 'connection.saved', 'create'),
    ).toBe('connection.saved');
    expect(
      getWorkspaceGitHubCredentialKey(undefined, undefined, 'connect'),
    ).toBe('connection.connect');
  });

  test('explains how to approve missing pull request permission', () => {
    expect(
      getGitHubPullRequestError(
        new Error('Resource not accessible by integration'),
      ),
    ).toContain('Pull requests: Read and write');
    expect(getGitHubPullRequestError(new Error('Validation Failed'))).toContain(
      'It may have no new commits',
    );
    expect(
      getGitHubPullRequestError(
        new Error('Validation Failed: No commits between main and feature'),
      ),
    ).toContain('There are no new commits');
  });
});
