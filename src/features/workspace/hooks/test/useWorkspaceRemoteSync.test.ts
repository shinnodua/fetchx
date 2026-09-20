import { describe, expect, test } from 'bun:test';
import { useWorkspaceStore } from '../../../../store';
import { useWorkspaceRemoteSync } from '../useWorkspaceRemoteSync';

describe('useWorkspaceRemoteSync', () => {
  test('is defined as a hook function', () => {
    expect(typeof useWorkspaceRemoteSync).toBe('function');
  });

  test('updates workspace syncStatus to syncing, synced, and error states', () => {
    const store = useWorkspaceStore.getState();
    const wsId = store.createGitHubWorkspace(
      'Hook Remote Sync WS',
      { repository: 'owner/hook-repo', branch: 'main' },
      [],
    );
    expect(wsId).toBeTruthy();
    if (!wsId) return;

    store.setWorkspaceSyncStatus(wsId, 'syncing');
    expect(
      useWorkspaceStore.getState().workspaces.find((w) => w.id === wsId)
        ?.syncStatus,
    ).toBe('syncing');

    store.setWorkspaceSyncStatus(wsId, 'synced');
    expect(
      useWorkspaceStore.getState().workspaces.find((w) => w.id === wsId)
        ?.syncStatus,
    ).toBe('synced');

    store.setWorkspaceSyncStatus(wsId, 'error');
    expect(
      useWorkspaceStore.getState().workspaces.find((w) => w.id === wsId)
        ?.syncStatus,
    ).toBe('error');

    store.removeWorkspace(wsId);
  });

  test('keeps the manual sync hook available for workspace-bound credentials', () => {
    const store = useWorkspaceStore.getState();
    const connection = {
      id: 'single-connection',
      accountId: 'account-1',
      accountLogin: 'octocat',
      mode: 'connect' as const,
      authType: 'oauth' as const,
      credentialKey: 'connection.single-connection',
    };
    store.upsertGitHubConnection(connection);
    const wsId = store.createGitHubWorkspace(
      'Credential-bound sync workspace',
      {
        repository: 'owner/repository',
        branch: 'main',
        connectionId: connection.id,
        credentialKey: connection.credentialKey,
      },
      [],
    );

    expect(wsId).toBeTruthy();
    if (wsId) store.removeWorkspace(wsId);
    store.removeGitHubConnection(connection.id);
  });

  test('stores credential key and connection info on workspace for sync resolution', () => {
    const store = useWorkspaceStore.getState();
    const connection = {
      id: 'github-oauth-sync-test',
      accountId: 'account-sync',
      accountLogin: 'testuser',
      mode: 'connect' as const,
      authType: 'oauth' as const,
      credentialKey: 'connection.github-oauth-sync-test',
    };
    store.upsertGitHubConnection(connection);
    const wsId = store.createGitHubWorkspace(
      'OAuth sync resolution workspace',
      {
        repository: 'owner/sync-repo',
        branch: 'main',
        connectionId: connection.id,
        connectionMode: 'connect',
        credentialKey: connection.credentialKey,
      },
      [],
    );
    expect(wsId).toBeTruthy();
    if (!wsId) return;

    const workspace = useWorkspaceStore
      .getState()
      .workspaces.find((w) => w.id === wsId);
    expect(workspace?.kind).toBe('github');
    expect(workspace?.github?.connectionId).toBe(connection.id);
    expect(workspace?.github?.credentialKey).toBe(connection.credentialKey);
    expect(workspace?.github?.connectionMode).toBe('connect');
    expect(workspace?.github?.repository).toBe('owner/sync-repo');

    const storedConnection = useWorkspaceStore
      .getState()
      .githubConnections.find((c) => c.id === connection.id);
    expect(storedConnection).toBeTruthy();
    expect(storedConnection?.credentialKey).toBe(connection.credentialKey);

    store.removeWorkspace(wsId);
    store.removeGitHubConnection(connection.id);
  });

  test('workspace credentialKey acts as fallback when connection credentialKey differs', () => {
    const store = useWorkspaceStore.getState();
    const connection = {
      id: 'github-legacy-conn',
      accountId: 'legacy',
      accountLogin: 'GitHub connection',
      mode: 'connect' as const,
      authType: 'pat' as const,
      credentialKey: 'connection.connect',
    };
    store.upsertGitHubConnection(connection);

    const wsCredentialKey = 'connection.github-oauth-new-key';
    const wsId = store.createGitHubWorkspace(
      'Fallback credential workspace',
      {
        repository: 'owner/fallback-repo',
        branch: 'main',
        connectionId: connection.id,
        connectionMode: 'connect',
        credentialKey: wsCredentialKey,
      },
      [],
    );
    expect(wsId).toBeTruthy();
    if (!wsId) return;

    const workspace = useWorkspaceStore
      .getState()
      .workspaces.find((w) => w.id === wsId);
    const storedConnection = useWorkspaceStore
      .getState()
      .githubConnections.find((c) => c.id === connection.id);

    // The workspace credentialKey differs from the connection descriptor's key
    expect(workspace?.github?.credentialKey).toBe(wsCredentialKey);
    expect(storedConnection?.credentialKey).toBe('connection.connect');
    expect(workspace?.github?.credentialKey).not.toBe(
      storedConnection?.credentialKey,
    );

    store.removeWorkspace(wsId);
    store.removeGitHubConnection(connection.id);
  });
});
