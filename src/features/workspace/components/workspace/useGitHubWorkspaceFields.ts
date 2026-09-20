import { useCallback, useEffect, useState } from 'react';
import type { GitHubRepository } from '../../../../services/github';
import type { WorkspaceDescriptor } from '../../../../store/workspace/workspaceStoreTypes';
import { getWorkspaceNameFromRepository } from '../../utils/workspaceRepositoryName';

interface UseGitHubWorkspaceFieldsParams {
  activeWorkspace?: WorkspaceDescriptor;
  isOpen: boolean;
  initialError?: string | null;
}

export function useGitHubWorkspaceFields({
  activeWorkspace,
  isOpen,
  initialError,
}: UseGitHubWorkspaceFieldsParams) {
  const [workspaceName, setWorkspaceName] = useState('');
  const [repository, setRepository] = useState('');
  const [branch, setBranch] = useState('main');
  const [organization, setOrganization] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);

  useEffect(() => {
    if (
      isOpen &&
      initialError &&
      activeWorkspace?.kind === 'github' &&
      activeWorkspace.github
    ) {
      const gh = activeWorkspace.github;
      setRepository((prev) => prev || gh.repository);
      setBranch((prev) => (prev === 'main' ? gh.branch : prev || gh.branch));
      setWorkspaceName((prev) => prev || activeWorkspace.name);
    }
  }, [initialError, isOpen, activeWorkspace]);

  const updateRepository = useCallback(
    (repositoryName: string) => {
      setRepository(repositoryName);
      if (!workspaceName.trim()) {
        setWorkspaceName(getWorkspaceNameFromRepository(repositoryName));
      }
    },
    [workspaceName],
  );

  const selectRepository = useCallback(
    (fullName: string, repositories: GitHubRepository[]) => {
      const selected = repositories.find((r) => r.fullName === fullName);
      if (!selected) return;
      updateRepository(selected.fullName);
      setBranch(selected.defaultBranch);
    },
    [updateRepository],
  );

  return {
    workspaceName,
    setWorkspaceName,
    repository,
    setRepository,
    branch,
    setBranch,
    organization,
    setOrganization,
    isPrivate,
    setIsPrivate,
    updateRepository,
    selectRepository,
  };
}
