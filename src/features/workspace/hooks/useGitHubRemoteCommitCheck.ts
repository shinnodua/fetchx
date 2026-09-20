import { useEffect } from 'react';
import {
  compareGitHubCommits,
  getGitHubBranchHead,
  pullGitHubWorkspace,
} from '../../../services/github';
import { useWorkspaceStore } from '../../../store';
import type {
  GitHubWorkspaceConnection,
  WorkspaceState,
} from '../../../store/workspace/workspaceStoreTypes';
import {
  createCollectionsSnapshot,
  getCollectionsDigest,
} from '../utils/workspaceRepositoryFormat';
import {
  createEmptyWorkspaceChangeIndex,
  createWorkspaceChangeIndex,
  getWorkspaceChangeCount,
} from '../utils/workspaceSyncState';

interface UseGitHubRemoteCommitCheckOptions {
  activeWorkspaceId: string;
  connection: GitHubWorkspaceConnection | null;
  isLocalDirty: boolean;
  setUnpulledCommitsCount: (count: number | null) => void;
  setWorkspaceGitHubSyncInfo: WorkspaceState['setWorkspaceGitHubSyncInfo'];
  setWorkspaceSyncStatus: WorkspaceState['setWorkspaceSyncStatus'];
  token: string;
}

export const getGitHubRemoteCheckSession = (
  repository: string | undefined,
  branch: string | undefined,
  sessionToken: string,
) => {
  const token = sessionToken.trim();
  return repository && branch && token ? { repository, branch, token } : null;
};

export function useGitHubRemoteCommitCheck({
  activeWorkspaceId,
  connection,
  isLocalDirty,
  setUnpulledCommitsCount,
  setWorkspaceGitHubSyncInfo,
  setWorkspaceSyncStatus,
  token,
}: UseGitHubRemoteCommitCheckOptions) {
  const repository = connection?.repository;
  const branch = connection?.branch;
  const lastSyncedCommitSha = connection?.lastSyncedCommitSha;
  const hasSyncedCollections = Boolean(connection?.lastSyncedCollections);
  const changeIndex = connection?.syncState?.changeIndex;

  useEffect(() => {
    const remoteCheck = getGitHubRemoteCheckSession(repository, branch, token);
    if (!remoteCheck) {
      setUnpulledCommitsCount(null);
      return;
    }

    let isCancelled = false;
    const checkRemoteCommits = async () => {
      try {
        const {
          repository: activeRepository,
          branch: activeBranch,
          token: syncToken,
        } = remoteCheck;

        if (!hasSyncedCollections) {
          const pulled = await pullGitHubWorkspace(
            syncToken,
            activeRepository,
            activeBranch,
          );
          const currentState = useWorkspaceStore.getState();
          if (
            isCancelled ||
            currentState.activeWorkspaceId !== activeWorkspaceId
          ) {
            return;
          }
          const nextChangeIndex = createWorkspaceChangeIndex(
            pulled.collections,
            currentState.collections,
          );
          setWorkspaceGitHubSyncInfo(activeWorkspaceId, {
            lastSyncedCommitSha: pulled.commitSha,
            lastSyncedCollectionsDigest: getCollectionsDigest(
              pulled.collections,
            ),
            lastSyncedCollections: createCollectionsSnapshot(
              pulled.collections,
            ),
            syncState: {
              changeIndex: nextChangeIndex,
              remote: {
                aheadBy: 0,
                headSha: pulled.commitSha,
                status: 'synced',
              },
            },
          });
          setWorkspaceSyncStatus(
            activeWorkspaceId,
            getWorkspaceChangeCount(nextChangeIndex) > 0 ? 'dirty' : 'synced',
          );
          return;
        }

        if (lastSyncedCommitSha) {
          const compare = await compareGitHubCommits(
            syncToken,
            activeRepository,
            lastSyncedCommitSha,
            activeBranch,
          );
          if (isCancelled) return;
          setUnpulledCommitsCount(compare.aheadBy);
          setWorkspaceGitHubSyncInfo(activeWorkspaceId, {
            syncState: {
              changeIndex: changeIndex ?? createEmptyWorkspaceChangeIndex(),
              remote: {
                aheadBy: compare.aheadBy,
                status:
                  compare.aheadBy > 0 && isLocalDirty
                    ? 'conflict'
                    : compare.aheadBy > 0
                      ? 'updates-available'
                      : 'synced',
              },
            },
          });
          return;
        }

        const headSha = await getGitHubBranchHead(
          syncToken,
          activeRepository,
          activeBranch,
        );
        if (!isCancelled) {
          setWorkspaceGitHubSyncInfo(activeWorkspaceId, {
            lastSyncedCommitSha: headSha,
          });
          setUnpulledCommitsCount(0);
        }
      } catch {
        // Background network failures should not interrupt editing.
      }
    };

    void checkRemoteCommits();
    return () => {
      isCancelled = true;
    };
  }, [
    activeWorkspaceId,
    branch,
    changeIndex,
    hasSyncedCollections,
    isLocalDirty,
    lastSyncedCommitSha,
    repository,
    setUnpulledCommitsCount,
    setWorkspaceGitHubSyncInfo,
    setWorkspaceSyncStatus,
    token,
  ]);
}
