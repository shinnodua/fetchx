import { isDesktopApp } from '../platform';

const GITHUB_API_URL = 'https://api.github.com';

interface GitHubApiInstallation {
  app_slug: string;
  account: { login: string };
}

interface GitHubApiInstallationsResponse {
  installations: GitHubApiInstallation[];
}

export const hasGitHubAppInstallation = async (
  token: string,
  appSlug: string,
  owner: string,
): Promise<boolean> => {
  if (isDesktopApp()) {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<boolean>('has_github_app_installation', {
      token,
      appSlug,
      owner,
    });
  }
  const response = await fetch(
    `${GITHUB_API_URL}/user/installations?per_page=100`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token.trim().replace(/^Bearer\s+/i, '')}`,
      },
    },
  );
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(
      body?.message || 'Could not check GitHub App installation.',
    );
  }
  const body = (await response.json()) as GitHubApiInstallationsResponse;
  return body.installations.some(
    (installation) =>
      installation.app_slug === appSlug &&
      installation.account.login.toLowerCase() === owner.trim().toLowerCase(),
  );
};
