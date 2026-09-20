import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import {
  createStoredCredentialFromAuth,
  ensureValidGitHubCredential,
  getGitHubConnectionCredentialKey,
  isGitHubTokenExpiredOrExpiringSoon,
  parseGitHubCredential,
  readGitHubStoredCredential,
  refreshStoredGitHubCredential,
  removeGitHubStoredCredential,
  resolveWorkspaceGitHubCredential,
  saveGitHubConnectionCredential,
  saveGitHubStoredCredential,
  serializeGitHubCredential,
} from '../githubCredentialService';

describe('githubCredentialService', () => {
  const originalWindow = globalThis.window;
  let storedCredentials: Record<string, string> = {};

  const setWindow = (val: unknown) => {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      writable: true,
      value: val,
    });
  };

  beforeEach(() => {
    storedCredentials = {};
    setWindow({
      __TAURI_INTERNALS__: {
        invoke: async (command: string, args: Record<string, unknown>) => {
          if (command === 'save_github_credential') {
            storedCredentials[args.credentialKey as string] =
              args.token as string;
            return;
          }
          if (command === 'read_github_credential') {
            return storedCredentials[args.credentialKey as string] ?? null;
          }
          if (command === 'remove_github_credential') {
            delete storedCredentials[args.credentialKey as string];
            return;
          }
          if (command === 'refresh_github_token') {
            return {
              accessToken: 'refreshed-access-token',
              expiresIn: 3600,
              refreshToken: 'refreshed-refresh-token',
              refreshTokenExpiresIn: 7200,
              tokenType: 'bearer',
            };
          }
          throw new Error(`Unexpected command: ${command}`);
        },
      },
    });
  });

  afterEach(() => {
    setWindow(originalWindow);
  });

  test('generates connection credential keys by mode', () => {
    expect(getGitHubConnectionCredentialKey('connect')).toBe(
      'connection.connect',
    );
    expect(getGitHubConnectionCredentialKey('create')).toBe(
      'connection.create',
    );
  });

  test('serializes and parses structured credentials', () => {
    const credential = {
      accessToken: 'ghu_test123',
      refreshToken: 'ghr_test456',
      expiresAt: 1700000000000,
      clientId: 'sync-client-id',
      mode: 'connect' as const,
    };
    const serialized = serializeGitHubCredential(credential);
    const parsed = parseGitHubCredential(serialized);
    expect(parsed?.accessToken).toBe('ghu_test123');
    expect(parsed?.refreshToken).toBe('ghr_test456');
    expect(parsed?.expiresAt).toBe(1700000000000);
    expect(parsed?.clientId).toBe('sync-client-id');
    expect(parsed?.mode).toBe('connect');
  });

  test('parses legacy raw token strings backwards-compatibly', () => {
    const rawToken = 'ghp_personalaccesstoken123';
    const parsed = parseGitHubCredential(rawToken);
    expect(parsed?.accessToken).toBe('ghp_personalaccesstoken123');
    expect(parsed?.refreshToken).toBeUndefined();
    expect(parsed?.expiresAt).toBeUndefined();

    expect(parseGitHubCredential('')).toBeNull();
    expect(parseGitHubCredential(null)).toBeNull();
  });

  test('detects token expiration with buffer', () => {
    const nonExpiring = { accessToken: 'ghp_token' };
    expect(isGitHubTokenExpiredOrExpiringSoon(nonExpiring)).toBe(false);

    const now = Date.now();
    const expired = {
      accessToken: 'ghu_token',
      expiresAt: now - 1000,
    };
    expect(isGitHubTokenExpiredOrExpiringSoon(expired)).toBe(true);

    const expiringSoon = {
      accessToken: 'ghu_token',
      expiresAt: now + 60 * 1000, // 1 minute from now (< 5 min buffer)
    };
    expect(isGitHubTokenExpiredOrExpiringSoon(expiringSoon)).toBe(true);

    const stillValid = {
      accessToken: 'ghu_token',
      expiresAt: now + 30 * 60 * 1000, // 30 minutes from now
    };
    expect(isGitHubTokenExpiredOrExpiringSoon(stillValid)).toBe(false);
  });

  test('creates stored credential from authorization response', () => {
    const auth = {
      accessToken: 'ghu_authorized',
      expiresIn: 3600,
      refreshToken: 'ghr_refresh',
      refreshTokenExpiresIn: 86400,
      tokenType: 'bearer',
    };
    const credential = createStoredCredentialFromAuth(auth, {
      clientId: 'sync-client-id',
      mode: 'connect',
    });
    expect(credential.accessToken).toBe('ghu_authorized');
    expect(credential.refreshToken).toBe('ghr_refresh');
    expect(credential.clientId).toBe('sync-client-id');
    expect(credential.mode).toBe('connect');
    expect(credential.expiresAt).toBeGreaterThan(Date.now());
  });

  test('saves and reads credentials through platform storage', async () => {
    storedCredentials['connection.connect'] = JSON.stringify({
      accessToken: 'saved-token',
      refreshToken: 'saved-refresh',
    });

    const read = await readGitHubStoredCredential('connection.connect');
    expect(read?.accessToken).toBe('saved-token');
    expect(read?.refreshToken).toBe('saved-refresh');

    await saveGitHubStoredCredential('connection.connect', {
      accessToken: 'new-token',
    });
    const updated = await readGitHubStoredCredential('connection.connect');
    expect(updated?.accessToken).toBe('new-token');

    await removeGitHubStoredCredential('connection.connect');
    const removed = await readGitHubStoredCredential('connection.connect');
    expect(removed).toBeNull();
  });

  test('refreshes expired credentials and updates storage', async () => {
    const expiredCredential = {
      accessToken: 'old-access-token',
      refreshToken: 'current-refresh-token',
      expiresAt: Date.now() - 1000,
      clientId: 'sync-client-id',
      mode: 'connect' as const,
    };

    storedCredentials['connection.connect'] = JSON.stringify(expiredCredential);

    const refreshed = await refreshStoredGitHubCredential(
      'connection.connect',
      expiredCredential,
    );

    expect(refreshed?.accessToken).toBe('refreshed-access-token');
    expect(refreshed?.refreshToken).toBe('refreshed-refresh-token');

    const updated = await readGitHubStoredCredential('connection.connect');
    expect(updated?.accessToken).toBe('refreshed-access-token');
  });

  test('ensureValidGitHubCredential returns valid credential or refreshes expired', async () => {
    const validCredential = {
      accessToken: 'active-token',
      refreshToken: 'refresh-token',
      expiresAt: Date.now() + 60 * 60 * 1000,
      clientId: 'sync-client-id',
    };

    storedCredentials['connection.connect'] = JSON.stringify(validCredential);

    const valid = await ensureValidGitHubCredential('connection.connect');
    expect(valid?.accessToken).toBe('active-token');

    const expiredCredential = {
      accessToken: 'expired-token',
      refreshToken: 'refresh-token',
      expiresAt: Date.now() - 1000,
      clientId: 'sync-client-id',
    };

    storedCredentials['connection.connect'] = JSON.stringify(expiredCredential);

    const refreshed = await ensureValidGitHubCredential('connection.connect');
    expect(refreshed?.accessToken).toBe('refreshed-access-token');
  });

  test('persists a validated connection token without replacing matching refresh metadata', async () => {
    storedCredentials['connection.connect'] = JSON.stringify({
      accessToken: 'connected-token',
      refreshToken: 'refresh-token',
      mode: 'connect',
    });

    const preserved = await saveGitHubConnectionCredential(
      'connect',
      'connected-token',
    );
    expect(preserved.refreshToken).toBe('refresh-token');

    const updated = await saveGitHubConnectionCredential(
      'connect',
      'replacement-token',
    );
    expect(updated).toMatchObject({
      accessToken: 'replacement-token',
      mode: 'connect',
    });
    expect(
      (await readGitHubStoredCredential('connection.connect'))?.accessToken,
    ).toBe('replacement-token');
  });

  test('resolveWorkspaceGitHubCredential resolves via key, repo name, or its mode connection fallback', async () => {
    // 1. Returns null when nothing is stored
    let resolved = await resolveWorkspaceGitHubCredential({
      repository: 'owner/empty-repo',
    });
    expect(resolved).toBeNull();

    // 2. A workspace only falls back to the connection matching its mode.
    storedCredentials['connection.connect'] = JSON.stringify({
      accessToken: 'fallback-connection-token',
    });
    resolved = await resolveWorkspaceGitHubCredential({
      repository: 'owner/some-repo',
      mode: 'connect',
    });
    expect(resolved?.credential.accessToken).toBe('fallback-connection-token');
    expect(resolved?.credentialKey).toBe('connection.connect');

    // 3. Resolves from sanitized repository key if present
    storedCredentials['owner_some-repo'] = JSON.stringify({
      accessToken: 'repo-specific-token',
    });
    resolved = await resolveWorkspaceGitHubCredential({
      repository: 'owner/some-repo',
      mode: 'connect',
    });
    expect(resolved?.credential.accessToken).toBe('repo-specific-token');
    expect(resolved?.credentialKey).toBe('owner_some-repo');

    // 4. Resolves from explicit credentialKey with highest priority
    storedCredentials['custom-key-123'] = JSON.stringify({
      accessToken: 'explicit-key-token',
    });
    resolved = await resolveWorkspaceGitHubCredential({
      credentialKey: 'custom-key-123',
      repository: 'owner/some-repo',
      mode: 'connect',
    });
    expect(resolved?.credential.accessToken).toBe('explicit-key-token');
    expect(resolved?.credentialKey).toBe('custom-key-123');

    storedCredentials['connection.create'] = JSON.stringify({
      accessToken: 'create-connection-token',
    });
    resolved = await resolveWorkspaceGitHubCredential({
      repository: 'owner/no-workspace-credential',
      mode: 'create',
    });
    expect(resolved?.credential.accessToken).toBe('create-connection-token');
    expect(resolved?.credentialKey).toBe('connection.create');
  });

  test('does not cross connection modes when resolving workspace credentials', async () => {
    storedCredentials['connection.connect'] = JSON.stringify({
      accessToken: 'connect-only-token',
    });

    const resolved = await resolveWorkspaceGitHubCredential({
      repository: 'owner/create-workspace',
      mode: 'create',
    });

    expect(resolved).toBeNull();
  });

  test('resolves an account-scoped connection credential without a mode fallback', async () => {
    storedCredentials['connection.github-account-a'] = JSON.stringify({
      accessToken: 'account-a-token',
      refreshToken: 'account-a-refresh-token',
    });

    const resolved = await resolveWorkspaceGitHubCredential({
      credentialKey: 'connection.github-account-a',
    });

    expect(resolved).toMatchObject({
      credentialKey: 'connection.github-account-a',
      credential: { accessToken: 'account-a-token' },
    });
  });
});
