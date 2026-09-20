import { useEffect } from 'react';
import {
  compareGitHubCommits,
  getGitHubBranchHead,
  pullGitHubWorkspace,
  resolveWorkspaceGitHubCredential,
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
  credentialKey?: string;
  isLocalDirty: boolean;
  setUnpulledCommitsCount: (count: number | null) => void;
  setWorkspaceGitHubSyncInfo: WorkspaceState['setWorkspaceGitHubSyncInfo'];
  setWorkspaceSyncStatus: WorkspaceState['setWorkspaceSyncStatus'];
  token: string;
}

export function useGitHubRemoteCommitCheck({
  activeWorkspaceId,
  connection,
  credentialKey,
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
    if (!repository || !branch) {
      setUnpulledCommitsCount(null);
      return;
    }

    let isCancelled = false;
    const checkRemoteCommits = async () => {
      try {
        const resolved = await resolveWorkspaceGitHubCredential({
          credentialKey,
          repository,
        });
        const syncToken = resolved?.credential.accessToken || token.trim();
        if (!syncToken) return;

        if (!hasSyncedCollections) {
          const pulled = await pullGitHubWorkspace(
            syncToken,
            repository,
            branch,
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
            repository,
            lastSyncedCommitSha,
            branch,
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
          repository,
          branch,
        );
        if (!isCancelled) {
          setWorkspaceGitHubSyncInfo(activeWorkspaceId, {
            lastSyncedCommitSha: headSha,
          });
          setUnpulledCommitsCount(0);
        }
      } catch {
        // Background network and credential failures should not interrupt editing.
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
    credentialKey,
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
