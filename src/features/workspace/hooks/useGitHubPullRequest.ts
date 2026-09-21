import { useState } from 'react';
import { useToast } from '../../../components';
import {
  createGitHubPullRequest,
  findOpenGitHubPullRequest,
  type GitHubBranch,
  getGitHubConnectionCredentialKey,
  listGitHubBranches,
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

interface PullRequestCredentialSession {
  workspaceId: string;
  token: string;
}

export const getPullRequestSessionToken = (
  session: PullRequestCredentialSession | null,
  workspaceId: string,
) => (session?.workspaceId === workspaceId ? session.token : null);

export const getWorkspaceGitHubCredentialKey = (
  workspaceCredentialKey: string | undefined,
  connectionCredentialKey: string | undefined,
  mode: 'connect' | 'create',
) =>
  workspaceCredentialKey ??
  connectionCredentialKey ??
  getGitHubConnectionCredentialKey(mode);

export const getGitHubPullRequestError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();
  if (normalized.includes('resource not accessible by integration')) {
    return 'The GitHub App installation does not have Pull requests: Read and write. Ask the personal-account or organization owner to approve the app’s updated permissions, then try again.';
  }
  if (normalized.includes('no commits between')) {
    return `There are no new commits to include in this pull request. Push another change or choose a different base branch. GitHub reported: ${message}`;
  }
  if (normalized.includes('pull request already exists')) {
    return `A pull request already exists for this branch. Open the repository on GitHub to review it. GitHub reported: ${message}`;
  }
  if (normalized === 'validation failed') {
    return 'GitHub could not create this pull request. It may have no new commits, use the same head and base branch, or already have a pull request. Push a new commit, choose another base branch, or check the repository on GitHub.';
  }
  return message || 'Could not create the pull request.';
};

export const useGitHubPullRequest = ({
  onError,
  onRequestToken,
}: UseGitHubPullRequestOptions) => {
  const { toast } = useToast();
  const { activeWorkspaceId, githubConnections, workspaces } =
    useWorkspaceStore();
  const [isWorking, setIsWorking] = useState(false);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credentialSession, setCredentialSession] =
    useState<PullRequestCredentialSession | null>(null);
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

  const resolveToken = async () => {
    if (!github) return null;
    const credentialKey = getWorkspaceGitHubCredentialKey(
      github.credentialKey,
      connection?.credentialKey,
      github.connectionMode ?? 'connect',
    );
    const resolved = await resolveWorkspaceGitHubCredential({
      credentialKey,
      repository: github.repository,
      mode: connection?.mode,
    });
    if (resolved?.credential.accessToken) {
      return resolved.credential.accessToken;
    }
    onError(
      'Connect GitHub or enter a personal access token to create a pull request.',
    );
    onRequestToken();
    return null;
  };

  const loadBranches = async (): Promise<GitHubBranch[]> => {
    if (!github) return [];
    setError(null);
    const token = await resolveToken();
    if (!token) return [];
    setIsLoadingBranches(true);
    try {
      const branches = await listGitHubBranches(token, github.repository);
      setCredentialSession({ workspaceId: activeWorkspaceId, token });
      return branches;
    } catch (error) {
      setError(getGitHubPullRequestError(error));
      return [];
    } finally {
      setIsLoadingBranches(false);
    }
  };

  const createPullRequest = async (input: {
    base: string;
    title: string;
    body: string;
  }) => {
    if (!github) return null;
    setError(null);
    if (github.branch === input.base) {
      setError('Choose a base branch different from the current branch.');
      return null;
    }
    if (hasUnpushedChanges) {
      setError('Push the current branch before creating a pull request.');
      return null;
    }
    const token =
      getPullRequestSessionToken(credentialSession, activeWorkspaceId) ??
      (await resolveToken());
    if (!token) return null;
    setIsWorking(true);
    try {
      const existing = await findOpenGitHubPullRequest(
        token,
        github.repository,
        github.branch,
      );
      const pullRequest =
        existing ??
        (await createGitHubPullRequest(token, github.repository, {
          ...input,
          head: github.branch,
        }));
      toast({
        title: existing ? 'Pull request already open' : 'Pull request created',
        description: `Pull request #${pullRequest.number}: ${pullRequest.title}`,
        type: 'success',
      });
      return pullRequest;
    } catch (error) {
      setError(getGitHubPullRequestError(error));
      return null;
    } finally {
      setIsWorking(false);
    }
  };

  return {
    createPullRequest,
    defaultBranch: github?.defaultBranch ?? 'main',
    error,
    hasUnpushedChanges,
    isLoadingBranches,
    isWorking,
    loadBranches,
    workspace,
  };
};
