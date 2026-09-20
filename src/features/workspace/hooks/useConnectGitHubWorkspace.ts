import { useEffect, useState } from 'react';
import { useToast } from '../../../components';
import {
  createGitHubRepository,
  pullGitHubWorkspace,
  pushGitHubWorkspace,
} from '../../../services/github';
import { useWorkspaceStore } from '../../../store';
import type { CollectionItem } from '../types';
import {
  getGitHubActionError,
  isRepositoryEmptyOrMissingWorkspace,
} from '../utils/workspaceSelectorUtils';

interface ConnectWorkspaceParams {
  mode: 'connect' | 'create';
  connectionId: string;
  credentialKey: string;
  token: string;
  repository: string;
  branch: string;
  workspaceName: string;
  organization: string;
  isPrivate: boolean;
  onSuccess: () => void;
}

export const useConnectGitHubWorkspace = (initialError?: string | null) => {
  const { toast } = useToast();
  const {
    collections,
    createGitHubWorkspace,
    setWorkspaceCollections,
    setWorkspaceGitHubSyncInfo,
    switchWorkspace,
    workspaces,
  } = useWorkspaceStore();

  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);

  useEffect(() => {
    if (initialError) {
      setError(initialError);
    }
  }, [initialError]);

  const connectWorkspace = async ({
    mode,
    connectionId,
    credentialKey,
    token,
    repository,
    branch,
    workspaceName,
    organization,
    isPrivate,
    onSuccess,
  }: ConnectWorkspaceParams) => {
    if (!token.trim() || !repository.trim()) {
      setError('Enter a GitHub access token and repository name.');
      return;
    }

    const targetWorkspaceName =
      workspaceName.trim() ||
      (mode === 'create'
        ? repository.trim()
        : repository.trim().split('/').at(-1) || 'GitHub Workspace');

    const existingWorkspace = workspaces.find(
      (w) => w.name.trim().toLowerCase() === targetWorkspaceName.toLowerCase(),
    );
    if (
      existingWorkspace &&
      (mode === 'create' || existingWorkspace.kind !== 'github')
    ) {
      setError(
        `A workspace named "${targetWorkspaceName}" already exists. Please choose a unique name.`,
      );
      return;
    }

    setIsWorking(true);
    setError(null);
    try {
      if (mode === 'create') {
        const created = await createGitHubRepository(token.trim(), {
          owner: organization.trim() || undefined,
          name: repository.trim(),
          private: isPrivate,
        });
        const pushed = await pushGitHubWorkspace(
          token.trim(),
          created.fullName,
          branch,
          collections,
        );
        createGitHubWorkspace(
          targetWorkspaceName,
          {
            repository: created.fullName,
            branch,
            connectionId,
            connectionMode: mode,
            credentialKey,
            lastSyncedCommitSha: pushed.commitSha,
          },
          JSON.parse(JSON.stringify(collections)),
        );
      } else {
        let collectionsToUse: CollectionItem[] = [];
        let isInitialSync = false;
        let initialCommitSha: string | undefined;
        try {
          const pulled = await pullGitHubWorkspace(
            token.trim(),
            repository.trim(),
            branch,
          );
          collectionsToUse = pulled.collections;
          initialCommitSha = pulled.commitSha;
        } catch (pullError) {
          if (!isRepositoryEmptyOrMissingWorkspace(pullError)) {
            throw pullError;
          }

          isInitialSync = true;
          collectionsToUse = [];
          const pushed = await pushGitHubWorkspace(
            token.trim(),
            repository.trim(),
            branch,
            [],
          );
          initialCommitSha = pushed.commitSha;
        }

        if (existingWorkspace && existingWorkspace.kind === 'github') {
          setWorkspaceGitHubSyncInfo(existingWorkspace.id, {
            repository: repository.trim(),
            branch,
            connectionId,
            connectionMode: mode,
            credentialKey,
            lastSyncedCommitSha: initialCommitSha,
          });
          if (collectionsToUse.length > 0) {
            setWorkspaceCollections(existingWorkspace.id, collectionsToUse);
          }
          switchWorkspace(existingWorkspace.id);
        } else {
          createGitHubWorkspace(
            targetWorkspaceName,
            {
              repository: repository.trim(),
              branch,
              connectionId,
              connectionMode: mode,
              credentialKey,
              lastSyncedCommitSha: initialCommitSha,
            },
            collectionsToUse,
          );
        }
        toast({
          title: existingWorkspace
            ? 'Workspace reconnected'
            : isInitialSync
              ? 'Workspace initialized'
              : 'Workspace connected',
          description: existingWorkspace
            ? `Updated credentials and connection for ${repository.trim()}.`
            : isInitialSync
              ? `Initialized ${repository.trim()} as a new workspace.`
              : `Connected ${repository.trim()} and loaded ${collectionsToUse.length} collection(s).`,
          type: 'success',
        });
      }
      onSuccess();
    } catch (setupError) {
      setError(
        getGitHubActionError(setupError, 'Could not connect to GitHub.'),
      );
    } finally {
      setIsWorking(false);
    }
  };

  return {
    isWorking,
    error,
    setError,
    connectWorkspace,
  };
};
