import { describe, expect, test } from 'bun:test';
import { getGitHubRemoteCheckSession } from '../useGitHubRemoteCommitCheck';

describe('useGitHubRemoteCommitCheck', () => {
  test('does not access GitHub during startup without an in-memory token', () => {
    expect(
      getGitHubRemoteCheckSession('owner/repository', 'main', ''),
    ).toBeNull();
    expect(
      getGitHubRemoteCheckSession('owner/repository', 'main', '   '),
    ).toBeNull();
  });

  test('allows remote checks after an explicit sync provides a session token', () => {
    expect(
      getGitHubRemoteCheckSession(
        'owner/repository',
        'main',
        ' session-token ',
      ),
    ).toEqual({
      repository: 'owner/repository',
      branch: 'main',
      token: 'session-token',
    });
  });
});
