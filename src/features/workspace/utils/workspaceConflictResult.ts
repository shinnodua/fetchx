import {
  createEmptyWorkspaceChangeIndex,
  createWorkspaceChangeIndex,
  getWorkspaceChangeCount,
} from './workspaceChangeIndex';
import {
  createCollectionsSnapshot,
  getCollectionsDigest,
} from './workspaceRepositoryFormat';
import {
  applyWorkspaceConflictResolutions,
  type WorkspaceConflictResolution,
  type WorkspaceSyncConflict,
} from './workspaceSyncState';

export const createWorkspaceConflictResult = (
  conflict: WorkspaceSyncConflict,
  resolutions?: Record<string, WorkspaceConflictResolution>,
) => {
  const mergedCollections = resolutions
    ? applyWorkspaceConflictResolutions(conflict, resolutions)
    : conflict.mergedCollections;
  const isDirty =
    getWorkspaceChangeCount(
      createWorkspaceChangeIndex(conflict.remoteCollections, mergedCollections),
    ) > 0;

  return {
    mergedCollections,
    syncStatus: isDirty ? ('dirty' as const) : ('synced' as const),
    githubSyncInfo: {
      lastSyncedCommitSha: conflict.remoteCommitSha,
      lastSyncedCollectionsDigest: getCollectionsDigest(
        conflict.remoteCollections,
      ),
      lastSyncedCollections: createCollectionsSnapshot(
        conflict.remoteCollections,
      ),
      syncState: {
        changeIndex: createEmptyWorkspaceChangeIndex(),
        remote: {
          aheadBy: 0,
          headSha: conflict.remoteCommitSha,
          status: 'synced' as const,
        },
      },
    },
  };
};
