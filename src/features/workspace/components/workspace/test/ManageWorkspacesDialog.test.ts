import { describe, expect, test } from 'bun:test';
import { LOCAL_WORKSPACE_ID, useWorkspaceStore } from '../../../../../store';

describe('ManageWorkspacesDialog actions and state integration', () => {
  test('manages workspaces list, active workspace, and collection transfers', () => {
    const store = useWorkspaceStore.getState();

    // Verify default state has local workspace
    expect(store.workspaces.some((w) => w.id === LOCAL_WORKSPACE_ID)).toBe(
      true,
    );

    // Create a new GitHub workspace
    const newWsId = store.createGitHubWorkspace(
      'Test Workspaces Dialog Repo',
      { repository: 'test/repo', branch: 'main' },
      [{ id: 'c-dialog-1', name: 'Dialog Col', requests: [] }],
    );

    expect(newWsId).toBeTruthy();
    if (!newWsId) return;

    // Check it's now in store
    const updatedStore = useWorkspaceStore.getState();
    expect(updatedStore.workspaces.some((w) => w.id === newWsId)).toBe(true);
    expect(updatedStore.activeWorkspaceId).toBe(newWsId);
    expect(updatedStore.collections).toHaveLength(1);

    // Move collection from newWsId to local workspace
    const moveSuccess = updatedStore.moveCollectionToWorkspace(
      'c-dialog-1',
      newWsId,
      LOCAL_WORKSPACE_ID,
    );
    expect(moveSuccess).toBe(true);

    const afterMove = useWorkspaceStore.getState();
    expect(afterMove.collections).toHaveLength(0);
    expect(afterMove.workspaceCollections[LOCAL_WORKSPACE_ID]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'c-dialog-1', name: 'Dialog Col' }),
      ]),
    );

    // Rename the workspace
    const renameSuccess = afterMove.renameWorkspace(
      newWsId,
      'Renamed Dialog Repo',
    );
    expect(renameSuccess).toBe(true);
    expect(
      useWorkspaceStore.getState().workspaces.find((w) => w.id === newWsId)
        ?.name,
    ).toBe('Renamed Dialog Repo');

    // Remove the workspace -> should switch active workspace to local
    const removeSuccess = useWorkspaceStore.getState().removeWorkspace(newWsId);
    expect(removeSuccess).toBe(true);

    const finalStore = useWorkspaceStore.getState();
    expect(finalStore.workspaces.some((w) => w.id === newWsId)).toBe(false);
    expect(finalStore.activeWorkspaceId).toBe(LOCAL_WORKSPACE_ID);
  });
});
