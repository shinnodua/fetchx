export type GitHubTokenType = 'classic' | 'fine-grained' | 'unknown';

export const getGitHubTokenType = (token: string): GitHubTokenType => {
  const trimmedToken = token.trim();
  if (trimmedToken.startsWith('github_pat_')) return 'fine-grained';
  if (/^gh[pousr]_/.test(trimmedToken)) return 'classic';
  return 'unknown';
};

export const getGitHubTokenTypeLabel = (token: string) => {
  const tokenType = getGitHubTokenType(token);
  if (tokenType === 'fine-grained')
    return 'Fine-grained personal access token detected';
  if (tokenType === 'classic') return 'Classic personal access token detected';
  return token.trim()
    ? 'Token format will be verified by GitHub'
    : 'Paste a classic or fine-grained personal access token';
};
