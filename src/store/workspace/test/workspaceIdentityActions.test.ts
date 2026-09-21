import { describe, expect, test } from 'bun:test';
import type { StateCreator } from 'zustand';
import { createWorkspaceIdentityActions } from '../workspaceIdentityActions';
import type { WorkspaceState } from '../workspaceStoreTypes';

type WorkspaceSet = Parameters<StateCreator<WorkspaceState>>[0];
type WorkspaceGet = Parameters<StateCreator<WorkspaceState>>[1];

const collection = { id: 'c-1', name: 'Users', requests: [] };

describe('workspace identity actions', () => {
  test('switches collection data and clears transient tabs', () => {
    let state = {
      workspaces: [
        { id: 'local', name: 'Local Workspace', kind: 'local' as const },
        {
          id: 'github',
          name: 'Team API',
          kind: 'github' as const,
          github: { repository: 'team/api', branch: 'main' },
        },
      ],
      activeWorkspaceId: 'local',
      workspaceCollections: { github: [collection] },
      collections: [{ id: 'c-local', name: 'Local', requests: [] }],
      tabs: ['r-1'],
      activeTabId: 'r-1',
      drafts: { 'r-1': { id: 'r-1' } },
      targetColId: 'c-local',
      searchTerm: 'local',
    } as unknown as WorkspaceState;
    const set = ((partial) => {
      const next = typeof partial === 'function' ? partial(state) : partial;
      state = { ...state, ...next } as WorkspaceState;
    }) as WorkspaceSet;
    const actions = createWorkspaceIdentityActions(
      set,
      (() => state) as WorkspaceGet,
    );

    actions.switchWorkspace('github');

    expect(state.activeWorkspaceId).toBe('github');
    expect(state.collections).toEqual([collection]);
    expect(state.tabs).toEqual([]);
    expect(state.drafts).toEqual({});
    expect(state.workspaceCollections.local).toHaveLength(1);
  });

  test('replaces open drafts with resolved workspace requests', () => {
    const resolvedRequest = {
      id: 'r-1',
      name: 'Resolved request',
      type: 'POST',
      target: 'https://resolved.example.com',
    };
    const resolvedCollections = [
      { id: 'c-1', name: 'Resolved collection', requests: [resolvedRequest] },
    ];
    let state = {
      activeWorkspaceId: 'github',
      workspaceCollections: { github: [] },
      collections: [],
      tabs: ['r-1', 'r-deleted'],
      activeTabId: 'r-deleted',
      drafts: {
        'r-1': {
          ...resolvedRequest,
          name: 'Stale draft',
          target: 'https://draft.example.com',
        },
        'r-deleted': {
          id: 'r-deleted',
          name: 'Deleted draft',
          type: 'GET',
          target: '',
        },
      },
    } as unknown as WorkspaceState;
    const set = ((partial) => {
      const next = typeof partial === 'function' ? partial(state) : partial;
      state = { ...state, ...next } as WorkspaceState;
    }) as WorkspaceSet;
    const actions = createWorkspaceIdentityActions(
      set,
      (() => state) as WorkspaceGet,
    );

    actions.setWorkspaceCollections('github', resolvedCollections, true);

    expect(state.collections).toEqual(resolvedCollections);
    expect(state.drafts['r-1']).toEqual(resolvedRequest);
    expect(state.drafts['r-deleted']).toBeUndefined();
    expect(state.tabs).toEqual(['r-1']);
    expect(state.activeTabId).toBe('r-1');
  });

  test('createGitHubWorkspace creates, activates, and isolates collections', () => {
    let state = {
      workspaces: [
        { id: 'local', name: 'Local Workspace', kind: 'local' as const },
      ],
      activeWorkspaceId: 'local',
      workspaceCollections: {
        local: [{ id: 'c-local', name: 'Local', requests: [] }],
      },
      collections: [{ id: 'c-local', name: 'Local', requests: [] }],
      tabs: ['r-1'],
      activeTabId: 'r-1',
      drafts: { 'r-1': { id: 'r-1' } },
      targetColId: 'c-local',
      searchTerm: 'local',
    } as unknown as WorkspaceState;
    const set = ((partial) => {
      const next = typeof partial === 'function' ? partial(state) : partial;
      state = { ...state, ...next } as WorkspaceState;
    }) as WorkspaceSet;
    const actions = createWorkspaceIdentityActions(
      set,
      (() => state) as WorkspaceGet,
    );

    const githubCol = { id: 'c-github', name: 'GitHub Repo', requests: [] };
    const newId = actions.createGitHubWorkspace(
      'New Repo',
      { repository: 'owner/repo', branch: 'main' },
      [githubCol],
    );

    expect(newId).toBeTruthy();
    expect(state.activeWorkspaceId).toBe(newId as string);
    expect(state.collections).toEqual([githubCol]);
    expect(state.workspaceCollections.local).toHaveLength(1);
    expect(state.workspaceCollections[newId as string]).toEqual([githubCol]);
    expect(state.tabs).toEqual([]);

    // Switch back to local and verify collections switch
    actions.switchWorkspace('local');
    expect(state.activeWorkspaceId).toBe('local');
    expect(state.collections).toEqual([
      { id: 'c-local', name: 'Local', requests: [] },
    ]);
  });

  test('enforces unique workspace names case-insensitively', () => {
    let state = {
      workspaces: [
        { id: 'local', name: 'Local Workspace', kind: 'local' as const },
        {
          id: 'gh-1',
          name: 'My Workspace',
          kind: 'github' as const,
          github: { repository: 'a/b', branch: 'main' },
        },
      ],
      activeWorkspaceId: 'local',
      workspaceCollections: {},
      collections: [],
    } as unknown as WorkspaceState;
    const set = ((partial) => {
      const next = typeof partial === 'function' ? partial(state) : partial;
      state = { ...state, ...next } as WorkspaceState;
    }) as WorkspaceSet;
    const actions = createWorkspaceIdentityActions(
      set,
      (() => state) as WorkspaceGet,
    );

    // Attempt to create duplicate name (exact and different case)
    const result1 = actions.createGitHubWorkspace('My Workspace', {
      repository: 'c/d',
      branch: 'main',
    });
    expect(result1).toBeUndefined();

    const result2 = actions.createGitHubWorkspace('my workspace', {
      repository: 'c/d',
      branch: 'main',
    });
    expect(result2).toBeUndefined();

    const result3 = actions.createGitHubWorkspace('local workspace', {
      repository: 'c/d',
      branch: 'main',
    });
    expect(result3).toBeUndefined();

    // Renaming collision check
    expect(actions.renameWorkspace('gh-1', 'Local Workspace')).toBe(false);
    expect(actions.renameWorkspace('gh-1', 'Renamed Workspace')).toBe(true);
    expect(state.workspaces[1].name).toBe('Renamed Workspace');
  });

  test('removes non-local workspaces and safely falls back to local workspace', () => {
    let state = {
      workspaces: [
        { id: 'local', name: 'Local Workspace', kind: 'local' as const },
        {
          id: 'gh-1',
          name: 'Repo 1',
          kind: 'github' as const,
          github: { repository: 'a/b', branch: 'main' },
        },
        {
          id: 'gh-2',
          name: 'Repo 2',
          kind: 'github' as const,
          github: { repository: 'c/d', branch: 'main' },
        },
      ],
      activeWorkspaceId: 'gh-1',
      workspaceCollections: {
        local: [{ id: 'c-local', name: 'Local Col', requests: [] }],
        'gh-1': [{ id: 'c-1', name: 'Col 1', requests: [] }],
        'gh-2': [{ id: 'c-2', name: 'Col 2', requests: [] }],
      },
      collections: [{ id: 'c-1', name: 'Col 1', requests: [] }],
      tabs: ['t-1'],
      activeTabId: 't-1',
      drafts: { 't-1': { id: 't-1' } },
      targetColId: '',
      searchTerm: '',
    } as unknown as WorkspaceState;
    const set = ((partial) => {
      const next = typeof partial === 'function' ? partial(state) : partial;
      state = { ...state, ...next } as WorkspaceState;
    }) as WorkspaceSet;
    const actions = createWorkspaceIdentityActions(
      set,
      (() => state) as WorkspaceGet,
    );

    // Attempt to remove permanent local workspace
    expect(actions.removeWorkspace('local')).toBe(false);
    expect(state.workspaces.some((w) => w.id === 'local')).toBe(true);

    // Remove active workspace gh-1 -> falls back to local workspace
    expect(actions.removeWorkspace('gh-1')).toBe(true);
    expect(state.workspaces.some((w) => w.id === 'gh-1')).toBe(false);
    expect(state.activeWorkspaceId).toBe('local');
    expect(state.collections).toEqual([
      { id: 'c-local', name: 'Local Col', requests: [] },
    ]);
    expect(state.tabs).toEqual([]);

    // Remove inactive workspace gh-2
    expect(actions.removeWorkspace('gh-2')).toBe(true);
    expect(state.workspaces.some((w) => w.id === 'gh-2')).toBe(false);
    expect(state.activeWorkspaceId).toBe('local');
  });

  test('moves collection between workspaces and updates active collections', () => {
    let state = {
      workspaces: [
        { id: 'local', name: 'Local Workspace', kind: 'local' as const },
        {
          id: 'gh-1',
          name: 'Repo 1',
          kind: 'github' as const,
          github: { repository: 'a/b', branch: 'main' },
        },
      ],
      activeWorkspaceId: 'local',
      workspaceCollections: {
        local: [
          { id: 'c-move', name: 'To Move', requests: [] },
          { id: 'c-keep', name: 'Keep', requests: [] },
        ],
        'gh-1': [{ id: 'c-existing', name: 'Existing', requests: [] }],
      },
      collections: [
        { id: 'c-move', name: 'To Move', requests: [] },
        { id: 'c-keep', name: 'Keep', requests: [] },
      ],
    } as unknown as WorkspaceState;
    const set = ((partial) => {
      const next = typeof partial === 'function' ? partial(state) : partial;
      state = { ...state, ...next } as WorkspaceState;
    }) as WorkspaceSet;
    const actions = createWorkspaceIdentityActions(
      set,
      (() => state) as WorkspaceGet,
    );

    // Move 'c-move' from active 'local' to 'gh-1'
    const success = actions.moveCollectionToWorkspace(
      'c-move',
      'local',
      'gh-1',
    );
    expect(success).toBe(true);

    // Source local workspace lost c-move
    expect(state.collections.map((c) => c.id)).toEqual(['c-keep']);
    expect(state.workspaceCollections.local.map((c) => c.id)).toEqual([
      'c-keep',
    ]);

    // Target gh-1 gained c-move
    expect(state.workspaceCollections['gh-1'].map((c) => c.id)).toEqual([
      'c-existing',
      'c-move',
    ]);

    // Move into target with same name suffixes with (copy)
    actions.moveCollectionToWorkspace('c-keep', 'local', 'gh-1');
    // Rename c-keep in local and move again with matching name
    state = {
      ...state,
      collections: [{ id: 'c-duplicate', name: 'Existing', requests: [] }],
      workspaceCollections: {
        ...state.workspaceCollections,
        local: [{ id: 'c-duplicate', name: 'Existing', requests: [] }],
      },
    };
    actions.moveCollectionToWorkspace('c-duplicate', 'local', 'gh-1');
    expect(
      state.workspaceCollections['gh-1'].some(
        (c) => c.name === 'Existing (copy)',
      ),
    ).toBe(true);
  });

  test('updates GitHub sync info on a workspace', () => {
    let state = {
      workspaces: [
        {
          id: 'gh-1',
          name: 'GH',
          kind: 'github' as const,
          github: { repository: 'owner/repo', branch: 'main' },
        },
      ],
    } as unknown as WorkspaceState;
    const set = ((partial) => {
      const next = typeof partial === 'function' ? partial(state) : partial;
      state = { ...state, ...next } as WorkspaceState;
    }) as WorkspaceSet;
    const actions = createWorkspaceIdentityActions(
      set,
      (() => state) as WorkspaceGet,
    );

    actions.setWorkspaceGitHubSyncInfo('gh-1', {
      lastSyncedCommitSha: 'sha-abc',
      lastSyncedCollectionsDigest: 'digest-xyz',
    });

    expect(state.workspaces[0]?.github?.lastSyncedCommitSha).toBe('sha-abc');
    expect(state.workspaces[0]?.github?.lastSyncedCollectionsDigest).toBe(
      'digest-xyz',
    );
  });

  test('migrates legacy workspace credentials into workspace-bound connections', () => {
    let state = {
      githubConnections: [],
      workspaces: [
        {
          id: 'gh-legacy',
          name: 'Legacy',
          kind: 'github' as const,
          github: {
            repository: 'owner/repo',
            branch: 'main',
            connectionMode: 'create' as const,
            credentialKey: 'owner_repo',
          },
        },
      ],
    } as unknown as WorkspaceState;
    const set = ((partial) => {
      const next = typeof partial === 'function' ? partial(state) : partial;
      state = { ...state, ...next } as WorkspaceState;
    }) as WorkspaceSet;
    const actions = createWorkspaceIdentityActions(
      set,
      (() => state) as WorkspaceGet,
    );

    actions.migrateLegacyGitHubConnections();

    expect(state.githubConnections).toEqual([
      expect.objectContaining({
        id: 'legacy-gh-legacy',
        credentialKey: 'owner_repo',
        mode: 'create',
      }),
    ]);
    expect(state.workspaces[0]?.github?.connectionId).toBe('legacy-gh-legacy');
  });

  test('repairs an orphaned connection ID using its original secure credential key', () => {
    let state = {
      githubConnections: [],
      workspaces: [
        {
          id: 'gh-orphaned',
          name: 'Orphaned',
          kind: 'github' as const,
          github: {
            repository: 'owner/repo',
            branch: 'main',
            connectionId: 'github-123456',
            connectionMode: 'connect' as const,
          },
        },
      ],
    } as unknown as WorkspaceState;
    const set = ((partial) => {
      const next = typeof partial === 'function' ? partial(state) : partial;
      state = { ...state, ...next } as WorkspaceState;
    }) as WorkspaceSet;
    const actions = createWorkspaceIdentityActions(
      set,
      (() => state) as WorkspaceGet,
    );

    actions.migrateLegacyGitHubConnections();

    expect(state.githubConnections[0]).toMatchObject({
      id: 'github-123456',
      credentialKey: 'connection.github-123456',
    });
    expect(state.workspaces[0]?.github?.credentialKey).toBe(
      'connection.github-123456',
    );
  });
});
