import { describe, expect, test } from 'bun:test';
import {
  getGitHubActionError,
  getGitHubRepositoryCreationError,
  initialModeCredentials,
  isGitHubAuthenticationError,
  isRepositoryEmptyOrMissingWorkspace,
} from '../workspaceSelectorUtils';

describe('workspaceSelectorUtils', () => {
  test('extracts error messages from various error types', () => {
    expect(
      getGitHubActionError(new Error('Network failure'), 'Fallback error'),
    ).toBe('Network failure');
    expect(getGitHubActionError('Direct string error', 'Fallback error')).toBe(
      'Direct string error',
    );
    expect(
      getGitHubActionError({ message: 'Object error' }, 'Fallback error'),
    ).toBe('Object error');
    expect(getGitHubActionError(null, 'Fallback error')).toBe('Fallback error');
    expect(getGitHubActionError(undefined, 'Fallback error')).toBe(
      'Fallback error',
    );
    expect(getGitHubActionError(12345, 'Fallback error')).toBe(
      'Fallback error',
    );
  });

  test('provides initial credentials for connect and create modes', () => {
    expect(initialModeCredentials.connect).toEqual({
      token: '',
      isGitHubConnected: false,
    });
    expect(initialModeCredentials.create).toEqual({
      token: '',
      isGitHubConnected: false,
    });
  });

  test('explains how to recover when GitHub App repository creation lacks permission', () => {
    expect(
      getGitHubRepositoryCreationError(
        new Error('Resource not accessible by integration'),
      ),
    ).toBe(
      'GitHub denied access. Install the Create repository GitHub App on the personal account or organization that will own the repository and confirm Administration: Read and write, or use a personal access token with repository administration access.',
    );
    expect(
      getGitHubRepositoryCreationError(new Error('Repository exists')),
    ).toBe('Repository exists');
  });

  test('detects empty repository or missing workspace errors', () => {
    expect(
      isRepositoryEmptyOrMissingWorkspace(
        new Error('This repository is empty.'),
      ),
    ).toBe(true);
    expect(
      isRepositoryEmptyOrMissingWorkspace(new Error('Git repository is empty')),
    ).toBe(true);
    expect(isRepositoryEmptyOrMissingWorkspace(new Error('Not Found'))).toBe(
      true,
    );
    expect(
      isRepositoryEmptyOrMissingWorkspace(
        new Error('GitHub request failed (404).'),
      ),
    ).toBe(true);
    expect(
      isRepositoryEmptyOrMissingWorkspace({
        message: 'This repository is empty.',
      }),
    ).toBe(true);
    expect(
      isRepositoryEmptyOrMissingWorkspace('This repository is empty.'),
    ).toBe(true);
  });

  test('does not treat authorization or network errors as missing workspace', () => {
    expect(
      isRepositoryEmptyOrMissingWorkspace(new Error('Bad credentials')),
    ).toBe(false);
    expect(
      isRepositoryEmptyOrMissingWorkspace(
        new Error('Resource not accessible by integration'),
      ),
    ).toBe(false);
    expect(
      isRepositoryEmptyOrMissingWorkspace(new Error('API rate limit exceeded')),
    ).toBe(false);
    expect(isRepositoryEmptyOrMissingWorkspace(null)).toBe(false);
  });

  test('only requests reconnection for authentication failures', () => {
    expect(
      isGitHubAuthenticationError(new Error('GitHub request failed (401).')),
    ).toBe(true);
    expect(isGitHubAuthenticationError(new Error('Bad credentials'))).toBe(
      true,
    );
    expect(
      isGitHubAuthenticationError(
        new Error('GitHub request failed (409): conflict'),
      ),
    ).toBe(false);
    expect(isGitHubAuthenticationError(new Error('Network failure'))).toBe(
      false,
    );
  });
});
