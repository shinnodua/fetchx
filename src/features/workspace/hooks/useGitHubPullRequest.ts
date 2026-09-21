import { useState } from 'react';
import { useToast } from '../../../components';
import {
  createGitHubPullRequest,
  findOpenGitHubPullRequest,
  getGitHubConnectionCredentialKey,
  resolveWorkspaceGitHubCredential,
} from '../../../services/github';
import { useWorkspaceStore } from '../../../store';
import {
  createEmptyWorkspaceChangeIndex,
  getWorkspaceChangeCount,
} from '../utils/workspaceSyncState';

interface UseGitHubPullRequestOptions {
  onError: (error: string) => void;
  onRequestToken: () => void;
}

export const useGitHubPullRequest = ({
  onError,
  onRequestToken,
}: UseGitHubPullRequestOptions) => {
  const { toast } = useToast();
  const { activeWorkspaceId, githubConnections, workspaces } =
    useWorkspaceStore();
  const [isWorking, setIsWorking] = useState(false);
  const workspace = workspaces.find((item) => item.id === activeWorkspaceId);
  const github = workspace?.github;
  const connection = githubConnections.find(
    (item) => item.id === github?.connectionId,
  );
  const hasUnpushedChanges = Boolean(
    github &&
      getWorkspaceChangeCount(
        github.syncState?.changeIndex ?? createEmptyWorkspaceChangeIndex(),
      ),
  );

  const createPullRequest = async (input: {
    base: string;
    title: string;
    body: string;
  }) => {
    if (!github) return null;
    if (github.branch === input.base) {
      onError('Choose a base branch different from the current branch.');
      return null;
    }
    if (hasUnpushedChanges) {
      onError('Push the current branch before creating a pull request.');
      return null;
    }
    const credentialKey =
      connection?.credentialKey ??
      github.credentialKey ??
      getGitHubConnectionCredentialKey(github.connectionMode ?? 'connect');
    const resolved = await resolveWorkspaceGitHubCredential({
      credentialKey,
      repository: github.repository,
      mode: connection?.mode,
    });
    if (!resolved?.credential.accessToken) {
      onError(
        'Connect GitHub or enter a personal access token to create a pull request.',
      );
      onRequestToken();
      return null;
    }
    setIsWorking(true);
    try {
      const existing = await findOpenGitHubPullRequest(
        resolved.credential.accessToken,
        github.repository,
        github.branch,
      );
      const pullRequest =
        existing ??
        (await createGitHubPullRequest(
          resolved.credential.accessToken,
          github.repository,
          { ...input, head: github.branch },
        ));
      toast({
        title: existing ? 'Pull request already open' : 'Pull request created',
        description: `Pull request #${pullRequest.number}: ${pullRequest.title}`,
        type: 'success',
      });
      return pullRequest;
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : 'Could not create the pull request.',
      );
      return null;
    } finally {
      setIsWorking(false);
    }
  };

  return {
    createPullRequest,
    defaultBranch: github?.defaultBranch ?? 'main',
    hasUnpushedChanges,
    isWorking,
    workspace,
  };
};
