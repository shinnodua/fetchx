import { useMemo, useState } from 'react';
import { useToast } from '../../../components';
import {
  compareGitHubCommits,
  getGitHubConnectionCredentialKey,
  pullGitHubWorkspace,
  pushGitHubWorkspace,
  readGitHubStoredCredential,
  refreshStoredGitHubCredential,
  resolveWorkspaceGitHubCredential,
  saveGitHubStoredCredential,
} from '../../../services/github';
import { useWorkspaceStore } from '../../../store';
import { createWorkspaceConflictResult } from '../utils/workspaceConflictResult';
import {
  createCollectionsSnapshot,
  getCollectionsDigest,
} from '../utils/workspaceRepositoryFormat';
import { isGitHubAuthenticationError } from '../utils/workspaceSelectorUtils';
import {
  createEmptyWorkspaceChangeIndex,
  createWorkspaceSyncConflict,
  getWorkspaceChangeCount,
  type WorkspaceConflictResolution,
  type WorkspaceSyncConflict,
} from '../utils/workspaceSyncState';
import { useGitHubRemoteCommitCheck } from './useGitHubRemoteCommitCheck';

interface UseWorkspaceRemoteSyncOptions {
  token: string;
  onRequestToken: () => void;
  onError: (error: string) => void;
}

export const useWorkspaceRemoteSync = ({
  token,
  onRequestToken,
  onError,
}: UseWorkspaceRemoteSyncOptions) => {
  const {
    activeWorkspaceId,
    collections,
    githubConnections,
    setWorkspaceCollections,
    setWorkspaceGitHubSyncInfo,
    setWorkspaceSyncStatus,
    workspaces,
  } = useWorkspaceStore();

  const { toast } = useToast();
  const [isWorking, setIsWorking] = useState(false);
  const [syncingDirection, setSyncingDirection] = useState<
    'pull' | 'push' | null
  >(null);
  const [unpulledCommitsCount, setUnpulledCommitsCount] = useState<
    number | null
  >(null);
  const [sessionCredential, setSessionCredential] = useState<{
    workspaceId: string;
    token: string;
  } | null>(null);
  const [conflict, setConflict] = useState<WorkspaceSyncConflict | null>(null);

  const activeWorkspace = workspaces.find(
    (workspace) => workspace.id === activeWorkspaceId,
  );
  const activeGitHub =
    activeWorkspace?.kind === 'github'
      ? (activeWorkspace.github ?? null)
      : null;
  const activeConnection = githubConnections.find(
    (connection) => connection.id === activeGitHub?.connectionId,
  );
  const credentialKey =
    activeConnection?.credentialKey ??
    activeGitHub?.credentialKey ??
    (activeGitHub && !activeConnection
      ? getGitHubConnectionCredentialKey(
          activeGitHub.connectionMode ?? 'connect',
        )
      : undefined);
  const isLocalDirty = useMemo(() => {
    if (activeWorkspace?.kind !== 'github') return false;
    return (
      getWorkspaceChangeCount(
        activeWorkspace.github?.syncState?.changeIndex ??
          createEmptyWorkspaceChangeIndex(),
      ) > 0
    );
  }, [activeWorkspace]);

  const unpushedCommitsCount = activeWorkspace?.github?.syncState
    ? getWorkspaceChangeCount(activeWorkspace.github.syncState.changeIndex)
    : 0;
  const remoteAheadBy =
    activeWorkspace?.github?.syncState?.remote.aheadBy ?? unpulledCommitsCount;
  const remoteCheckToken =
    token.trim() ||
    (sessionCredential?.workspaceId === activeWorkspaceId
      ? sessionCredential.token
      : '');

  useGitHubRemoteCommitCheck({
    activeWorkspaceId,
    connection: activeGitHub,
    isLocalDirty,
    setUnpulledCommitsCount,
    setWorkspaceGitHubSyncInfo,
    setWorkspaceSyncStatus,
    token: remoteCheckToken,
  });

  const handleSync = async (direction: 'pull' | 'push') => {
    const gh = activeWorkspace?.github;
    if (!gh) return;

    const canUseLegacyModeCredential =
      activeConnection &&
      githubConnections.filter(
        (connection) => connection.mode === activeConnection.mode,
      ).length === 1;
    let resolved = await resolveWorkspaceGitHubCredential({
      credentialKey,
      repository: gh.repository,
      mode: canUseLegacyModeCredential ? activeConnection.mode : undefined,
    });

    // Fallback: try the workspace-stored credentialKey directly when the
    // primary resolution (which may use the connection descriptor key) fails.
    if (!resolved && gh.credentialKey && gh.credentialKey !== credentialKey) {
      const fallbackCred = await readGitHubStoredCredential(
        gh.credentialKey,
      ).catch(() => null);

      if (fallbackCred?.accessToken) {
        resolved = {
          credential: fallbackCred,
          credentialKey: gh.credentialKey,
        };
      }
    }
    if (
      resolved &&
      activeConnection &&
      resolved.credentialKey !== activeConnection.credentialKey
    ) {
      // A legacy credential is already known to be readable. Do not prevent
      // this pull or push when copying it to the new account-scoped key fails.
      await saveGitHubStoredCredential(
        activeConnection.credentialKey,
        resolved.credential,
      ).catch(() => {});
    }
    const syncToken = resolved?.credential.accessToken || token.trim();
    if (!syncToken) {
      onError(
        'Connect GitHub or enter a personal access token to sync this workspace.',
      );
      onRequestToken();
      return;
    }
    setSessionCredential({ workspaceId: activeWorkspace.id, token: syncToken });

    const performSyncOperation = async (activeToken: string) => {
      if (direction === 'pull') {
        const pulled = await pullGitHubWorkspace(
          activeToken,
          gh.repository,
          gh.branch,
        );
        setWorkspaceCollections(activeWorkspace.id, pulled.collections);
        setWorkspaceGitHubSyncInfo(activeWorkspace.id, {
          lastSyncedCommitSha: pulled.commitSha,
          lastSyncedCollectionsDigest: getCollectionsDigest(pulled.collections),
          lastSyncedCollections: createCollectionsSnapshot(pulled.collections),
          syncState: {
            changeIndex: createEmptyWorkspaceChangeIndex(),
            remote: { aheadBy: 0, headSha: pulled.commitSha, status: 'synced' },
          },
        });
        setUnpulledCommitsCount(0);
      } else {
        const pushed = await pushGitHubWorkspace(
          activeToken,
          gh.repository,
          gh.branch,
          collections,
        );
        setWorkspaceGitHubSyncInfo(activeWorkspace.id, {
          lastSyncedCommitSha: pushed.commitSha,
          lastSyncedCollectionsDigest: getCollectionsDigest(collections),
          lastSyncedCollections: createCollectionsSnapshot(collections),
          syncState: {
            changeIndex: createEmptyWorkspaceChangeIndex(),
            remote: { aheadBy: 0, headSha: pushed.commitSha, status: 'synced' },
          },
        });
      }
    };

    const compare = gh.lastSyncedCommitSha
      ? await compareGitHubCommits(
          syncToken,
          gh.repository,
          gh.lastSyncedCommitSha,
          gh.branch,
        )
      : null;
    if (isLocalDirty && compare && compare.aheadBy > 0) {
      const baselineCollections = gh.lastSyncedCollections;
      if (!baselineCollections) {
        onError('Pull from GitHub once before resolving concurrent changes.');
        return;
      }
      try {
        const remote = await pullGitHubWorkspace(
          syncToken,
          gh.repository,
          gh.branch,
        );
        const nextConflict = createWorkspaceSyncConflict(
          baselineCollections,
          collections,
          remote.collections,
          gh.lastSyncedCommitSha,
          remote.commitSha,
        );
        if (nextConflict.entries.length === 0) {
          const result = createWorkspaceConflictResult(nextConflict);
          setWorkspaceGitHubSyncInfo(activeWorkspace.id, result.githubSyncInfo);
          setWorkspaceCollections(activeWorkspace.id, result.mergedCollections);
          setWorkspaceSyncStatus(activeWorkspace.id, result.syncStatus);
          toast({
            title: 'Changes merged automatically',
            description: 'Local and GitHub changes did not overlap.',
            type: 'success',
          });
          return;
        }
        setConflict(nextConflict);
        setWorkspaceSyncStatus(activeWorkspace.id, 'conflict');
      } catch (conflictError) {
        const errorMessage =
          conflictError instanceof Error
            ? conflictError.message
            : 'Could not load the remote changes.';
        toast({
          title: 'Could not load GitHub changes',
          description: errorMessage,
          type: 'error',
        });
        if (isGitHubAuthenticationError(conflictError)) {
          onError(errorMessage);
          onRequestToken();
        }
      }
      return;
    }

    setIsWorking(true);
    setSyncingDirection(direction);
    setWorkspaceSyncStatus(activeWorkspace.id, 'syncing');
    toast({
      title:
        direction === 'pull' ? 'Pulling from GitHub…' : 'Pushing to GitHub…',
      description:
        direction === 'pull'
          ? `Fetching latest changes from ${gh.branch}.`
          : `Pushing collections to ${gh.branch}.`,
      type: 'default',
    });

    try {
      await performSyncOperation(syncToken);
      setWorkspaceSyncStatus(activeWorkspace.id, 'synced');
      toast({
        title: direction === 'pull' ? 'Pull completed' : 'Push completed',
        description:
          direction === 'pull'
            ? `Workspace updated from ${gh.branch}.`
            : `Successfully pushed collections to ${gh.branch}.`,
        type: 'success',
      });
    } catch (syncError) {
      const isAuthError = isGitHubAuthenticationError(syncError);

      if (isAuthError && resolved?.credential.refreshToken) {
        try {
          const refreshed = await refreshStoredGitHubCredential(
            resolved.credentialKey,
            resolved.credential,
          );
          if (refreshed?.accessToken) {
            await performSyncOperation(refreshed.accessToken);
            setWorkspaceSyncStatus(activeWorkspace.id, 'synced');
            toast({
              title: direction === 'pull' ? 'Pull completed' : 'Push completed',
              description:
                direction === 'pull'
                  ? `Workspace updated from ${gh.branch}.`
                  : `Successfully pushed collections to ${gh.branch}.`,
              type: 'success',
            });
            return;
          }
        } catch {
          // If refresh fails, fall through to reporting error
        }
      }

      setWorkspaceSyncStatus(activeWorkspace.id, 'error');
      const errorMessage =
        syncError instanceof Error ? syncError.message : 'GitHub sync failed.';
      toast({
        title: direction === 'pull' ? 'Pull failed' : 'Push failed',
        description: errorMessage,
        type: 'error',
      });
      if (isAuthError) {
        onError(errorMessage);
        onRequestToken();
      }
    } finally {
      setIsWorking(false);
      setSyncingDirection(null);
    }
  };

  const resolveConflict = (
    resolutions: Record<string, WorkspaceConflictResolution>,
  ) => {
    if (!conflict || !activeWorkspace?.github) return;
    let result: ReturnType<typeof createWorkspaceConflictResult>;
    try {
      result = createWorkspaceConflictResult(conflict, resolutions);
    } catch (resolutionError) {
      toast({
        title: 'Could not apply resolution',
        description:
          resolutionError instanceof Error
            ? resolutionError.message
            : 'The resolved workspace is invalid.',
        type: 'error',
      });
      return;
    }
    setWorkspaceGitHubSyncInfo(activeWorkspace.id, result.githubSyncInfo);
    setWorkspaceCollections(activeWorkspace.id, result.mergedCollections, true);
    setWorkspaceSyncStatus(activeWorkspace.id, result.syncStatus);
    setConflict(null);
  };

  return {
    activeWorkspace,
    isLocalDirty,
    unpushedCommitsCount,
    unpulledCommitsCount: remoteAheadBy,
    isWorking,
    syncingDirection,
    handleSync,
    conflict,
    resolveConflict,
    dismissConflict: () => setConflict(null),
  };
};
