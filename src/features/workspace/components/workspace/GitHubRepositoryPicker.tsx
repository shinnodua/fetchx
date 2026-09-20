import type React from 'react';
import { Button, Input, Select, Switch } from '../../../../components';
import {
  type GitHubRepository,
  getGitHubAppInstallationUrl,
} from '../../../../services/github';
import { openExternalUrl } from '../../../../services/platform';

interface GitHubRepositoryPickerProps {
  mode: 'connect' | 'create';
  repository: string;
  organization: string;
  isPrivate: boolean;
  repositories: GitHubRepository[];
  isLoadingRepositories: boolean;
  hasLoadedRepositories: boolean;
  isGitHubConnected: boolean;
  token: string;
  onRepositoryChange: (repo: string) => void;
  onSelectRepository: (fullName: string) => void;
  onOrganizationChange: (org: string) => void;
  onIsPrivateChange: (isPrivate: boolean) => void;
  onReloadRepositories: () => void;
}

export const GitHubRepositoryPicker: React.FC<GitHubRepositoryPickerProps> = ({
  mode,
  repository,
  organization,
  isPrivate,
  repositories,
  isLoadingRepositories,
  hasLoadedRepositories,
  isGitHubConnected,
  token,
  onRepositoryChange,
  onSelectRepository,
  onOrganizationChange,
  onIsPrivateChange,
  onReloadRepositories,
}) => {
  if (mode === 'create') {
    return (
      <>
        <Input
          label="Repository name"
          value={repository}
          onChange={(event) => onRepositoryChange(event.target.value)}
          placeholder="api-collections"
        />
        <Input
          label="Organization (optional)"
          value={organization}
          onChange={(event) => onOrganizationChange(event.target.value)}
          placeholder="Leave empty for your personal account"
        />
        <Switch
          checked={isPrivate}
          onCheckedChange={onIsPrivateChange}
          label="Private repository"
        />
      </>
    );
  }

  if (hasLoadedRepositories || isLoadingRepositories) {
    return (
      <>
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <Select
              label="GitHub repository"
              value={repository}
              onChange={onSelectRepository}
              options={repositories.map((repositoryOption) => ({
                value: repositoryOption.fullName,
                label: repositoryOption.fullName,
              }))}
              placeholder={
                repositories.length
                  ? 'Select a repository'
                  : 'No accessible repositories'
              }
              disabled={!isLoadingRepositories && !repositories.length}
              isLoading={isLoadingRepositories}
              loadingLabel="Loading repositories…"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-[38px] shrink-0"
            isLoading={isLoadingRepositories}
            disabled={isLoadingRepositories || !token.trim()}
            onClick={onReloadRepositories}
            title="Reload repositories"
          >
            Reload
          </Button>
        </div>
        {repositories.length > 0 && isGitHubConnected && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-[11px] text-foreground/50 hover:bg-transparent hover:text-foreground/80 hover:underline"
              onClick={() =>
                void openExternalUrl(getGitHubAppInstallationUrl(mode))
              }
            >
              Grant access to more repositories ↗
            </Button>
          </div>
        )}
        {!isLoadingRepositories && !repositories.length && (
          <div className="space-y-3 rounded-xl border border-foreground/10 bg-foreground/[0.02] p-3">
            <p className="text-xs leading-relaxed text-foreground/70">
              No accessible repositories found. Install the FetchX App on GitHub
              to choose which repositories to grant access to (just like
              Cloudflare), or enter the repository manually below.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                className="h-7 text-xs font-medium"
                onClick={() =>
                  void openExternalUrl(getGitHubAppInstallationUrl(mode))
                }
              >
                Select repositories on GitHub ↗
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[11px]"
                onClick={() =>
                  void openExternalUrl(
                    'https://github.com/settings/tokens/new?scopes=repo&description=FetchX',
                  )
                }
              >
                Create personal token ↗
              </Button>
            </div>
            <Input
              label="Repository"
              value={repository}
              onChange={(event) => onRepositoryChange(event.target.value)}
              placeholder="owner/repository"
            />
          </div>
        )}
      </>
    );
  }

  return (
    <Input
      label="Repository"
      value={repository}
      onChange={(event) => onRepositoryChange(event.target.value)}
      placeholder="owner/repository"
    />
  );
};
