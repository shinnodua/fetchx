import { describe, expect, test } from 'bun:test';
import { useWorkspaceStore } from '../../../../store';
import { useConnectGitHubWorkspace } from '../useConnectGitHubWorkspace';

describe('useConnectGitHubWorkspace', () => {
  test('is defined as a hook function', () => {
    expect(typeof useConnectGitHubWorkspace).toBe('function');
  });

  test('allows updating sync info for existing workspace', () => {
    const store = useWorkspaceStore.getState();
    const wsId = store.createGitHubWorkspace(
      'Reconnect Test WS',
      { repository: 'owner/old-repo', branch: 'main' },
      [],
    );
    expect(wsId).toBeTruthy();
    if (!wsId) return;

    store.setWorkspaceGitHubSyncInfo(wsId, {
      repository: 'owner/new-repo',
      branch: 'develop',
      credentialKey: 'owner_new-repo',
    });

    const updated = useWorkspaceStore
      .getState()
      .workspaces.find((w) => w.id === wsId);
    expect(updated?.github?.repository).toBe('owner/new-repo');
    expect(updated?.github?.branch).toBe('develop');
    expect(updated?.github?.credentialKey).toBe('owner_new-repo');

    store.removeWorkspace(wsId);
  });
});
