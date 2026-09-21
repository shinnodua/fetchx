import { useState } from 'react';
import { useToast } from '../../../components';
import {
  createGitHubBranch,
  getGitHubBranchHead,
  getGitHubConnectionCredentialKey,
  listGitHubBranches,
  pullGitHubWorkspace,
  resolveWorkspaceGitHubCredential,
} from '../../../services/github';
import { useWorkspaceStore } from '../../../store';
import {
  createCollectionsSnapshot,
  getCollectionsDigest,
} from '../utils/workspaceRepositoryFormat';
import {
  createEmptyWorkspaceChangeIndex,
  getWorkspaceChangeCount,
} from '../utils/workspaceSyncState';

interface UseGitHubBranchManagerOptions {
  onError: (error: string) => void;
  onRequestToken: () => void;
}

export const useGitHubBranchManager = ({
  onError,
  onRequestToken,
}: UseGitHubBranchManagerOptions) => {
  const { toast } = useToast();
  const {
    activeWorkspaceId,
    collections,
    githubConnections,
    setWorkspaceCollections,
    setWorkspaceGitHubSyncInfo,
    setWorkspaceSyncStatus,
    workspaces,
  } = useWorkspaceStore();
  const [isWorking, setIsWorking] = useState(false);

  const activeWorkspace = workspaces.find(
    (workspace) => workspace.id === activeWorkspaceId,
  );
  const github = activeWorkspace?.github;
  const connection = githubConnections.find(
    (item) => item.id === github?.connectionId,
  );
  const isDirty = Boolean(
    github &&
      getWorkspaceChangeCount(
        github.syncState?.changeIndex ?? createEmptyWorkspaceChangeIndex(),
      ),
  );

  const resolveToken = async () => {
    if (!github) return null;
    const credentialKey =
      connection?.credentialKey ??
      github.credentialKey ??
      getGitHubConnectionCredentialKey(github.connectionMode ?? 'connect');
    const resolved = await resolveWorkspaceGitHubCredential({
      credentialKey,
      repository: github.repository,
      mode: connection?.mode,
    });
    if (resolved?.credential.accessToken)
      return resolved.credential.accessToken;
    onError('Connect GitHub or enter a personal access token to continue.');
    onRequestToken();
    return null;
  };

  const loadBranches = async () => {
    if (!github) return [];
    const token = await resolveToken();
    if (!token) return [];
    setIsWorking(true);
    try {
      return await listGitHubBranches(token, github.repository);
    } catch (error) {
      onError(
        error instanceof Error ? error.message : 'Could not load branches.',
      );
      return [];
    } finally {
      setIsWorking(false);
    }
  };

  const switchBranch = async (branch: string, discardChanges = false) => {
    if (!github || branch === github.branch) return true;
    if (isDirty && !discardChanges) return false;
    const token = await resolveToken();
    if (!token) return false;
    setIsWorking(true);
    setWorkspaceSyncStatus(activeWorkspaceId, 'syncing');
    try {
      const pulled = await pullGitHubWorkspace(
        token,
        github.repository,
        branch,
      );
      setWorkspaceCollections(activeWorkspaceId, pulled.collections, true);
      setWorkspaceGitHubSyncInfo(activeWorkspaceId, {
        branch,
        lastSyncedCommitSha: pulled.commitSha,
        lastSyncedCollectionsDigest: getCollectionsDigest(pulled.collections),
        lastSyncedCollections: createCollectionsSnapshot(pulled.collections),
        syncState: {
          changeIndex: createEmptyWorkspaceChangeIndex(),
          remote: { aheadBy: 0, headSha: pulled.commitSha, status: 'synced' },
        },
      });
      setWorkspaceSyncStatus(activeWorkspaceId, 'synced');
      toast({
        title: 'Branch switched',
        description: `Loaded ${branch}.`,
        type: 'success',
      });
      return true;
    } catch (error) {
      setWorkspaceSyncStatus(activeWorkspaceId, 'error');
      onError(
        error instanceof Error ? error.message : 'Could not switch branches.',
      );
      return false;
    } finally {
      setIsWorking(false);
    }
  };

  const createBranch = async (name: string) => {
    if (!github) return null;
    const token = await resolveToken();
    if (!token) return null;
    setIsWorking(true);
    try {
      const sourceSha = await getGitHubBranchHead(
        token,
        github.repository,
        github.branch,
      );
      const branch = await createGitHubBranch(
        token,
        github.repository,
        name,
        sourceSha,
      );
      toast({
        title: 'Branch created',
        description: `Created ${branch.name}.`,
        type: 'success',
      });
      return branch;
    } catch (error) {
      onError(
        error instanceof Error ? error.message : 'Could not create the branch.',
      );
      return null;
    } finally {
      setIsWorking(false);
    }
  };

  return {
    activeWorkspace,
    collections,
    createBranch,
    isDirty,
    isWorking,
    loadBranches,
    switchBranch,
  };
};
