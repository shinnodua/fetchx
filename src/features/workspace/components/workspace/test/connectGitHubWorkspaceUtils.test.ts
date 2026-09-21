import { describe, expect, test } from 'bun:test';
import type { GitHubConnectionDescriptor } from '../../../../../store/workspace/workspaceStoreTypes';
import {
  canMigrateLegacyModeCredential,
  canMirrorModeCredential,
  disconnectGitHubStoredConnection,
  getGitHubConnectionForAccount,
  getSavedGitHubConnectionForMode,
  INITIAL_GITHUB_CONNECTIONS_BY_MODE,
} from '../connectGitHubWorkspaceUtils';

describe('connectGitHubWorkspaceUtils', () => {
  test('INITIAL_GITHUB_CONNECTIONS_BY_MODE has disconnected initial defaults', () => {
    expect(INITIAL_GITHUB_CONNECTIONS_BY_MODE.connect.token).toBe('');
    expect(INITIAL_GITHUB_CONNECTIONS_BY_MODE.connect.isGitHubConnected).toBe(
      false,
    );
    expect(INITIAL_GITHUB_CONNECTIONS_BY_MODE.create.token).toBe('');
    expect(INITIAL_GITHUB_CONNECTIONS_BY_MODE.create.isGitHubConnected).toBe(
      false,
    );
  });

  test('only identifies a saved connection for the active mode', () => {
    const connection: GitHubConnectionDescriptor = {
      id: 'conn-123',
      accountId: 'acc-1',
      accountLogin: 'octocat',
      mode: 'connect',
      authType: 'oauth',
      credentialKey: 'connection.conn-123',
    };

    expect(getSavedGitHubConnectionForMode([], 'connect')).toBeUndefined();
    expect(
      getSavedGitHubConnectionForMode([connection], 'create'),
    ).toBeUndefined();
    expect(getSavedGitHubConnectionForMode([connection], 'connect')).toBe(
      connection,
    );
  });

  test('disconnectGitHubStoredConnection removes the connection by id', async () => {
    let removedId: string | null = null;
    const connection: GitHubConnectionDescriptor = {
      id: 'conn-123',
      accountId: 'acc-1',
      accountLogin: 'octocat',
      mode: 'connect',
      authType: 'pat',
      credentialKey: 'connection.conn-123',
    };

    await disconnectGitHubStoredConnection(connection, (id) => {
      removedId = id;
    });

    expect(removedId).toBe('conn-123');
  });

  test('disconnectGitHubStoredConnection handles undefined connection gracefully', async () => {
    let removeCalled = false;
    await disconnectGitHubStoredConnection(undefined, () => {
      removeCalled = true;
    });
    expect(removeCalled).toBe(false);
  });

  test('reuses an existing account connection within the same mode', () => {
    const existing: GitHubConnectionDescriptor = {
      id: 'conn-123',
      accountId: 'acc-1',
      accountLogin: 'octocat',
      mode: 'connect',
      authType: 'pat',
      credentialKey: 'connection.conn-123',
    };

    const reused = getGitHubConnectionForAccount(
      { id: 'acc-1', login: 'octocat-renamed' },
      'oauth',
      'connect',
      [existing],
      { accessToken: 'new-access-token', expiresAt: 123 },
    );
    const separateMode = getGitHubConnectionForAccount(
      { id: 'acc-1', login: 'octocat-renamed' },
      'oauth',
      'create',
      [existing],
    );

    expect(reused).toMatchObject({
      id: 'conn-123',
      credentialKey: 'connection.conn-123',
      accountLogin: 'octocat-renamed',
      authType: 'oauth',
      expiresAt: 123,
    });
    expect(separateMode.id).not.toBe('conn-123');
    expect(separateMode.mode).toBe('create');
  });

  test('migrates a legacy mode credential only when it cannot mix accounts', () => {
    const onlyConnection: GitHubConnectionDescriptor = {
      id: 'conn-123',
      accountId: 'acc-1',
      accountLogin: 'octocat',
      mode: 'connect',
      authType: 'oauth',
      credentialKey: 'connection.conn-123',
    };
    const anotherConnection = {
      ...onlyConnection,
      id: 'conn-456',
      accountId: 'acc-2',
      credentialKey: 'connection.conn-456',
    };

    expect(
      canMigrateLegacyModeCredential(onlyConnection, [onlyConnection]),
    ).toBe(true);
    expect(
      canMigrateLegacyModeCredential(onlyConnection, [
        onlyConnection,
        anotherConnection,
      ]),
    ).toBe(false);
  });

  test('mirrors a mode credential only while it has one account', () => {
    const onlyConnection: GitHubConnectionDescriptor = {
      id: 'conn-123',
      accountId: 'acc-1',
      accountLogin: 'octocat',
      mode: 'connect',
      authType: 'oauth',
      credentialKey: 'connection.conn-123',
    };
    const anotherConnection = {
      ...onlyConnection,
      id: 'conn-456',
      accountId: 'acc-2',
      credentialKey: 'connection.conn-456',
    };

    expect(canMirrorModeCredential(onlyConnection, [])).toBe(true);
    expect(canMirrorModeCredential(onlyConnection, [onlyConnection])).toBe(
      true,
    );
    expect(
      canMirrorModeCredential(onlyConnection, [
        onlyConnection,
        anotherConnection,
      ]),
    ).toBe(false);
  });

  test('keeps account-scoped credential keys stable when reusing an account', () => {
    const existing: GitHubConnectionDescriptor = {
      id: 'conn-123',
      accountId: 'acc-1',
      accountLogin: 'octocat',
      mode: 'connect',
      authType: 'oauth',
      credentialKey: 'connection.conn-123',
    };

    const connection = getGitHubConnectionForAccount(
      { id: 'acc-1', login: 'octocat' },
      'oauth',
      'connect',
      [existing],
    );

    expect(connection.credentialKey).toBe('connection.conn-123');
  });
});
