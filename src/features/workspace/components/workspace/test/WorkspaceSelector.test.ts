import { describe, expect, test } from 'bun:test';
import { LOCAL_WORKSPACE_ID, useWorkspaceStore } from '../../../../../store';
import { getCollectionsDigest } from '../../../utils/workspaceRepositoryFormat';

describe('WorkspaceSelector sync indicators and commit count logic', () => {
  test('detects local uncommitted changes against last synced digest', () => {
    const store = useWorkspaceStore.getState();

    // Create a GitHub workspace
    const wsId = store.createGitHubWorkspace(
      'Selector Test WS',
      { repository: 'owner/selector-repo', branch: 'feat/indicators' },
      [{ id: 'col-sync-1', name: 'Sync Col', requests: [] }],
    );

    expect(wsId).toBeTruthy();
    if (!wsId) return;

    const currentWs = useWorkspaceStore
      .getState()
      .workspaces.find((w) => w.id === wsId);
    expect(currentWs?.github?.branch).toBe('feat/indicators');
    expect(currentWs?.github?.lastSyncedCollectionsDigest).toBeTruthy();

    const initialDigest = currentWs?.github?.lastSyncedCollectionsDigest;
    const currentDigest = getCollectionsDigest(
      useWorkspaceStore.getState().collections,
    );

    // Right after creation, collections match digest -> 0 unpushed commits
    expect(currentDigest).toBe(initialDigest);

    // Edit a collection locally -> uncommitted change detected
    const modifiedCollections = [
      {
        id: 'col-sync-1',
        name: 'Sync Col Modified',
        requests: [],
      },
    ];
    store.setCollections(modifiedCollections);

    const modifiedDigest = getCollectionsDigest(
      useWorkspaceStore.getState().collections,
    );
    expect(modifiedDigest).not.toBe(initialDigest);

    // Syncing updates the digest and clears uncommitted status
    store.setWorkspaceGitHubSyncInfo(wsId, {
      lastSyncedCollectionsDigest: modifiedDigest,
      lastSyncedCommitSha: 'sha-new-head',
    });

    const syncedWs = useWorkspaceStore
      .getState()
      .workspaces.find((w) => w.id === wsId);
    expect(syncedWs?.github?.lastSyncedCollectionsDigest).toBe(modifiedDigest);
    expect(syncedWs?.github?.lastSyncedCommitSha).toBe('sha-new-head');

    // Clean up
    store.removeWorkspace(wsId);
    expect(useWorkspaceStore.getState().activeWorkspaceId).toBe(
      LOCAL_WORKSPACE_ID,
    );
  });

  test('computes appropriate status text for pull and push directions', () => {
    const getSyncStatusText = (direction: 'pull' | 'push' | null) =>
      direction === 'pull'
        ? 'Pulling…'
        : direction === 'push'
          ? 'Pushing…'
          : 'Syncing…';

    expect(getSyncStatusText('pull')).toBe('Pulling…');
    expect(getSyncStatusText('push')).toBe('Pushing…');
    expect(getSyncStatusText(null)).toBe('Syncing…');
  });

  test('tracks syncing status in workspace store', () => {
    const store = useWorkspaceStore.getState();
    const wsId = store.createGitHubWorkspace(
      'Sync Status WS',
      { repository: 'owner/status-repo', branch: 'main' },
      [],
    );
    expect(wsId).toBeTruthy();
    if (!wsId) return;

    store.setWorkspaceSyncStatus(wsId, 'syncing');
    let ws = useWorkspaceStore.getState().workspaces.find((w) => w.id === wsId);
    expect(ws?.syncStatus).toBe('syncing');

    store.setWorkspaceSyncStatus(wsId, 'synced');
    ws = useWorkspaceStore.getState().workspaces.find((w) => w.id === wsId);
    expect(ws?.syncStatus).toBe('synced');

    store.setWorkspaceSyncStatus(wsId, 'error');
    ws = useWorkspaceStore.getState().workspaces.find((w) => w.id === wsId);
    expect(ws?.syncStatus).toBe('error');

    store.removeWorkspace(wsId);
  });
});
