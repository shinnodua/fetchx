export interface ModeCredential {
  token: string;
  isGitHubConnected: boolean;
}

export const initialModeCredentials: Record<
  'connect' | 'create',
  ModeCredential
> = {
  connect: { token: '', isGitHubConnected: false },
  create: { token: '', isGitHubConnected: false },
};

export const getGitHubActionError = (
  error: unknown,
  fallback = 'Could not connect to GitHub.',
): string => {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error.trim()) return error;
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string' &&
    (error as { message: string }).message.trim()
  ) {
    return (error as { message: string }).message;
  }
  return fallback;
};

export const getGitHubRepositoryCreationError = (error: unknown): string => {
  const message = getGitHubActionError(
    error,
    'Could not create the GitHub repository.',
  );
  if (
    message.toLowerCase().includes('resource not accessible by integration')
  ) {
    return 'GitHub denied access. Install the Create repository GitHub App on the personal account or organization that will own the repository and confirm Administration: Read and write, or use a personal access token with repository administration access.';
  }
  return message;
};

export const isGitHubAuthenticationError = (error: unknown): boolean => {
  const message = getGitHubActionError(error, '').toLowerCase();
  return (
    message.includes('(401)') ||
    message.includes('bad credentials') ||
    message.includes('unauthorized') ||
    message.includes('invalid token')
  );
};

export const isRepositoryEmptyOrMissingWorkspace = (
  error: unknown,
): boolean => {
  if (!error) return false;
  const message = getGitHubActionError(error, '');
  const normalized = message.toLowerCase();
  return (
    normalized.includes('this repository is empty') ||
    normalized.includes('repository is empty') ||
    normalized.includes('not found') ||
    normalized.includes('404')
  );
};
