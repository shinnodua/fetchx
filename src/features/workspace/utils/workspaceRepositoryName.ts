export const getWorkspaceNameFromRepository = (repository: string) => {
  const repositoryPath = repository.trim().replace(/\/+$/, '');
  const repositoryName = repositoryPath.split('/').at(-1)?.trim() || '';

  return repositoryName.replace(/\.git$/i, '');
};
