const GITHUB_API_URL = 'https://api.github.com';

interface GitHubBranchApiResponse {
  name: string;
  commit: { sha: string };
}

interface GitHubPullRequestApiResponse {
  number: number;
  html_url: string;
  title: string;
}

interface GitHubReferenceApiResponse {
  ref: string;
  object: { sha: string };
}

interface GitHubApiErrorBody {
  message?: string;
  errors?: Array<
    | string
    | { code?: string; field?: string; message?: string; resource?: string }
  >;
}

export interface GitHubBranch {
  name: string;
  commitSha: string;
}

export interface GitHubPullRequest {
  number: number;
  url: string;
  title: string;
}

const getHeaders = (token: string) => ({
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${token.trim().replace(/^Bearer\s+/i, '')}`,
});

export const getGitHubApiErrorMessage = (
  body: GitHubApiErrorBody | null,
  status: number,
) => {
  const details = body?.errors
    ?.map((error) =>
      typeof error === 'string'
        ? error
        : error.message || [error.field, error.code].filter(Boolean).join(' '),
    )
    .filter(Boolean);
  const message = body?.message || `GitHub request failed (${status}).`;
  return details?.length ? `${message}: ${details.join('; ')}` : message;
};

const request = async <T>(token: string, path: string, init?: RequestInit) => {
  const response = await fetch(`${GITHUB_API_URL}${path}`, {
    ...init,
    headers: { ...getHeaders(token), ...init?.headers },
  });
  if (!response.ok) {
    const body = (await response
      .json()
      .catch(() => null)) as GitHubApiErrorBody | null;
    throw new Error(getGitHubApiErrorMessage(body, response.status));
  }
  return response.json() as Promise<T>;
};

const toPullRequest = (
  pullRequest: GitHubPullRequestApiResponse,
): GitHubPullRequest => ({
  number: pullRequest.number,
  url: pullRequest.html_url,
  title: pullRequest.title,
});

export const listGitHubBranches = async (
  token: string,
  repository: string,
): Promise<GitHubBranch[]> => {
  const branches = await request<GitHubBranchApiResponse[]>(
    token,
    `/repos/${repository}/branches?per_page=100`,
  );
  return branches
    .map((branch) => ({ name: branch.name, commitSha: branch.commit.sha }))
    .sort((left, right) => left.name.localeCompare(right.name));
};

export const createGitHubBranch = async (
  token: string,
  repository: string,
  name: string,
  sourceSha: string,
): Promise<GitHubBranch> => {
  const branchName = name.trim();
  if (!branchName) throw new Error('Enter a branch name.');
  const created = await request<GitHubReferenceApiResponse>(
    token,
    `/repos/${repository}/git/refs`,
    {
      method: 'POST',
      body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: sourceSha }),
    },
  );
  return {
    name: created.ref.replace('refs/heads/', ''),
    commitSha: created.object.sha,
  };
};

export const findOpenGitHubPullRequest = async (
  token: string,
  repository: string,
  headBranch: string,
): Promise<GitHubPullRequest | null> => {
  const owner = repository.split('/')[0];
  const pulls = await request<GitHubPullRequestApiResponse[]>(
    token,
    `/repos/${repository}/pulls?state=open&head=${encodeURIComponent(`${owner}:${headBranch}`)}`,
  );
  return pulls[0] ? toPullRequest(pulls[0]) : null;
};

export const createGitHubPullRequest = async (
  token: string,
  repository: string,
  input: { head: string; base: string; title: string; body: string },
): Promise<GitHubPullRequest> => {
  const created = await request<GitHubPullRequestApiResponse>(
    token,
    `/repos/${repository}/pulls`,
    { method: 'POST', body: JSON.stringify(input) },
  );
  return toPullRequest(created);
};
