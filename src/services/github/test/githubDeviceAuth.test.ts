import { describe, expect, test } from 'bun:test';
import {
  completeGitHubDeviceAuthorization,
  getGitHubAppClientId,
  getGitHubAppInstallationUrl,
  getGitHubAppSlug,
  isGitHubAuthorizationPending,
} from '../githubDeviceAuth';

describe('github device authorization', () => {
  test('selects the dedicated app client ID for each workspace action', () => {
    expect(getGitHubAppClientId('connect')).toBe(
      import.meta.env.VITE_GITHUB_SYNC_CLIENT_ID?.trim(),
    );
    expect(getGitHubAppClientId('create')).toBe(
      import.meta.env.VITE_GITHUB_CREATE_CLIENT_ID?.trim(),
    );
  });

  test('constructs GitHub App installation URLs for connect and create modes', () => {
    expect(getGitHubAppSlug('connect')).toBe('fetchx-sync');
    expect(getGitHubAppSlug('create')).toBe('fetchx-create');
    expect(getGitHubAppInstallationUrl('connect')).toBe(
      'https://github.com/apps/fetchx-sync/installations/new',
    );
    expect(getGitHubAppInstallationUrl('create')).toBe(
      'https://github.com/apps/fetchx-create/installations/new',
    );
  });

  test('returns the GitHub token after a completed device authorization', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          access_token: 'device-token',
          refresh_token: 'device-refresh',
          expires_in: 3600,
        }),
        {
          status: 200,
        },
      )) as typeof fetch;
    try {
      const result = await completeGitHubDeviceAuthorization(
        'client-id',
        'device-code',
      );
      expect(result.accessToken).toBe('device-token');
      expect(result.refreshToken).toBe('device-refresh');
      expect(result.expiresIn).toBe(3600);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('identifies GitHub device authorizations that are still pending', () => {
    expect(
      isGitHubAuthorizationPending(
        new Error(
          'Authorization is still pending. Complete it in GitHub, then try again.',
        ),
      ),
    ).toBe(true);
    expect(isGitHubAuthorizationPending(new Error('Access denied.'))).toBe(
      false,
    );
    expect(isGitHubAuthorizationPending('authorization_pending')).toBe(true);
    expect(
      isGitHubAuthorizationPending({ message: 'authorization_pending' }),
    ).toBe(true);
  });
});
