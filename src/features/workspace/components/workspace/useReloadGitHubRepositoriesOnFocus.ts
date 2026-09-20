import { useEffect } from 'react';

interface UseReloadGitHubRepositoriesOnFocusParams {
  isOpen: boolean;
  isGitHubConnected: boolean;
  mode: 'connect' | 'create';
  repositoriesCount: number;
  token: string;
  loadRepositories: (accessToken: string) => Promise<void>;
}

export function useReloadGitHubRepositoriesOnFocus({
  isOpen,
  isGitHubConnected,
  mode,
  repositoriesCount,
  token,
  loadRepositories,
}: UseReloadGitHubRepositoriesOnFocusParams) {
  useEffect(() => {
    if (
      !isOpen ||
      mode !== 'connect' ||
      !isGitHubConnected ||
      repositoriesCount > 0
    ) {
      return;
    }
    const handleFocus = () => {
      if (token.trim()) void loadRepositories(token.trim());
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [
    isOpen,
    mode,
    isGitHubConnected,
    repositoriesCount,
    token,
    loadRepositories,
  ]);
}
