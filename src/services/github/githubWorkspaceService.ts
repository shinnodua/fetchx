import type { CollectionItem } from '../../features/workspace/types';
import {
  createWorkspaceManifest,
  parseRepositoryCollection,
  parseWorkspaceManifest,
  serializeCollectionForRepository,
  WORKSPACE_COLLECTIONS_DIRECTORY,
  WORKSPACE_MANIFEST_PATH,
} from '../../features/workspace/utils/workspaceRepositoryFormat';
import { isDesktopApp } from '../platform';
import {
  getCollectionCommitMessage,
  getWorkspaceCommitMessage,
} from './githubCommitMessage';

const GITHUB_API_URL = 'https://api.github.com';

export interface GitHubRepository {
  fullName: string;
  owner: string;
  name: string;
  defaultBranch: string;
  private: boolean;
}

export interface GitHubAccount {
  id: string;
  login: string;
}

interface GitHubContent {
  content: string;
  sha: string;
}

interface GitHubDirectoryContent {
  path: string;
  sha: string;
  type: 'file' | 'dir' | 'symlink' | 'submodule';
}

interface GitHubApiRepository {
  full_name: string;
  owner: { login: string };
  name: string;
  default_branch?: string;
  private: boolean;
}

interface GitHubApiAccount {
  id: number;
  login: string;
}

const cleanToken = (token: string) => token.trim().replace(/^Bearer\s+/i, '');

const getHeaders = (token: string) => ({
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${cleanToken(token)}`,
});

const toRepository = (repository: GitHubApiRepository): GitHubRepository => ({
  fullName: repository.full_name,
  owner: repository.owner.login,
  name: repository.name,
  defaultBranch: repository.default_branch || 'main',
  private: repository.private,
});

const request = async <T>(
  token: string,
  path: string,
  init?: RequestInit,
): Promise<T> => {
  const response = await fetch(`${GITHUB_API_URL}${path}`, {
    ...init,
    headers: { ...getHeaders(token), ...init?.headers },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(
      body?.message || `GitHub request failed (${response.status}).`,
    );
  }
  return response.json() as Promise<T>;
};

const encodeContent = (content: string) =>
  btoa(unescape(encodeURIComponent(content)));
const decodeContent = (content: string) =>
  decodeURIComponent(escape(atob(content.replace(/\n/g, ''))));

const tryParseRepositoryCollection = (file: GitHubContent | null) => {
  if (!file) return null;
  try {
    return parseRepositoryCollection(decodeContent(file.content));
  } catch {
    return null;
  }
};

export const listGitHubRepositories = async (token: string) => {
  if (isDesktopApp()) {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<GitHubRepository[]>('list_github_repositories', { token });
  }
  const repositories = await request<GitHubApiRepository[]>(
    token,
    '/user/repos?affiliation=owner,collaborator,organization_member&per_page=100&sort=updated',
  );
  return repositories.map(toRepository);
};

export const getGitHubAccount = async (
  token: string,
): Promise<GitHubAccount> => {
  if (isDesktopApp()) {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<GitHubAccount>('get_github_account', { token });
  }
  const account = await request<GitHubApiAccount>(token, '/user');
  return { id: String(account.id), login: account.login };
};

export const createGitHubRepository = async (
  token: string,
  input: {
    owner?: string;
    name: string;
    private: boolean;
    description?: string;
  },
) => {
  const path = input.owner ? `/orgs/${input.owner}/repos` : '/user/repos';
  const repository = await request<GitHubApiRepository>(token, path, {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      private: input.private,
      description: input.description || undefined,
      auto_init: false,
    }),
  });
  return toRepository(repository);
};

const encodePath = (path: string) =>
  path.split('/').map(encodeURIComponent).join('/');

const getRepositoryContent = async (
  token: string,
  repository: string,
  path: string,
  branch: string,
) =>
  request<GitHubContent>(
    token,
    `/repos/${repository}/contents/${encodePath(path)}?ref=${encodeURIComponent(branch)}`,
  );

export interface GitHubBranchResponse {
  name: string;
  commit: {
    sha: string;
  };
}

export interface GitHubCompareResponse {
  status: 'ahead' | 'behind' | 'identical' | 'diverged';
  ahead_by: number;
  behind_by: number;
  total_commits: number;
}

export interface GitHubCommitCompare {
  aheadBy: number;
  behindBy: number;
  status: 'ahead' | 'behind' | 'identical' | 'diverged';
}

export const getGitHubBranchHead = async (
  token: string,
  repository: string,
  branch: string,
): Promise<string> => {
  const branchData = await request<GitHubBranchResponse>(
    token,
    `/repos/${repository}/branches/${encodeURIComponent(branch)}`,
  );
  return branchData.commit.sha;
};

export const compareGitHubCommits = async (
  token: string,
  repository: string,
  baseSha: string,
  headBranch: string,
): Promise<GitHubCommitCompare> => {
  try {
    const data = await request<GitHubCompareResponse>(
      token,
      `/repos/${repository}/compare/${encodeURIComponent(baseSha)}...${encodeURIComponent(headBranch)}`,
    );
    return {
      aheadBy: data.ahead_by,
      behindBy: data.behind_by,
      status: data.status,
    };
  } catch {
    return { aheadBy: 0, behindBy: 0, status: 'identical' };
  }
};

export const pullGitHubWorkspace = async (
  token: string,
  repository: string,
  ref: string,
) => {
  const [manifestFile, branchHeadSha] = await Promise.all([
    getRepositoryContent(token, repository, WORKSPACE_MANIFEST_PATH, ref),
    getGitHubBranchHead(token, repository, ref).catch(() => ref),
  ]);
  const manifest = parseWorkspaceManifest(decodeContent(manifestFile.content));
  const collections = await Promise.all(
    manifest.collections.map(async (collection) => {
      const file = await getRepositoryContent(
        token,
        repository,
        collection.path,
        ref,
      );
      return parseRepositoryCollection(decodeContent(file.content));
    }),
  );
  return {
    collections,
    revision: manifestFile.sha,
    commitSha: branchHeadSha,
  };
};

export const pushGitHubWorkspace = async (
  token: string,
  repository: string,
  branch: string,
  collections: CollectionItem[],
) => {
  const previousManifestFile = await getRepositoryContent(
    token,
    repository,
    WORKSPACE_MANIFEST_PATH,
    branch,
  ).catch(() => null);
  const manifest = createWorkspaceManifest(collections);
  const previousManifest = (() => {
    if (!previousManifestFile) return null;
    try {
      return parseWorkspaceManifest(
        decodeContent(previousManifestFile.content),
      );
    } catch {
      return null;
    }
  })();
  const files = [
    {
      path: WORKSPACE_MANIFEST_PATH,
      content: JSON.stringify(manifest, null, 2),
      collection: undefined,
    },
    ...collections.map((collection) => ({
      path:
        manifest.collections.find((entry) => entry.id === collection.id)
          ?.path || '',
      content: serializeCollectionForRepository(collection),
      collection,
    })),
  ];

  let latestCommitSha: string | undefined;

  for (const file of files) {
    const existing =
      file.path === WORKSPACE_MANIFEST_PATH
        ? previousManifestFile
        : await getRepositoryContent(
            token,
            repository,
            file.path,
            branch,
          ).catch(() => null);
    if (
      file.collection &&
      existing &&
      decodeContent(existing.content) === file.content
    ) {
      continue;
    }
    const result = await request<{ commit?: { sha?: string } }>(
      token,
      `/repos/${repository}/contents/${encodePath(file.path)}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          message: file.collection
            ? getCollectionCommitMessage(
                tryParseRepositoryCollection(existing),
                file.collection,
              )
            : getWorkspaceCommitMessage(previousManifest, manifest),
          content: encodeContent(file.content),
          branch,
          sha: existing?.sha,
        }),
      },
    );
    if (result.commit?.sha) {
      latestCommitSha = result.commit.sha;
    }
  }

  const currentCollectionPaths = new Set(
    manifest.collections.map((collection) => collection.path),
  );
  const repositoryCollectionFiles = await request<GitHubDirectoryContent[]>(
    token,
    `/repos/${repository}/contents/${encodePath(WORKSPACE_COLLECTIONS_DIRECTORY)}?ref=${encodeURIComponent(branch)}`,
  ).catch(() => []);
  const removedCollectionFiles = repositoryCollectionFiles.filter(
    (file) =>
      file.type === 'file' &&
      file.path.endsWith('.json') &&
      !currentCollectionPaths.has(file.path),
  );

  for (const file of removedCollectionFiles) {
    const deletedCollection = previousManifest?.collections.find(
      (collection) => collection.path === file.path,
    );
    const deletedCollectionName =
      deletedCollection?.name ||
      file.path
        .split('/')
        .at(-1)
        ?.replace(/\.json$/, '');
    const result = await request<{ commit?: { sha?: string } }>(
      token,
      `/repos/${repository}/contents/${encodePath(file.path)}`,
      {
        method: 'DELETE',
        body: JSON.stringify({
          message: `chore(fetchx): delete collection "${deletedCollectionName}"`,
          branch,
          sha: file.sha,
        }),
      },
    );
    if (result.commit?.sha) {
      latestCommitSha = result.commit.sha;
    }
  }

  if (!latestCommitSha) {
    latestCommitSha = await getGitHubBranchHead(
      token,
      repository,
      branch,
    ).catch(() => undefined);
  }

  return { commitSha: latestCommitSha };
};
