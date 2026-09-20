import type React from 'react';
import { Alert, Button, Dialog, Input, Select } from '../../../../components';
import { readStoredGitHubConnectionCredential } from './connectGitHubWorkspaceUtils';
import { GitHubRepositoryPicker } from './GitHubRepositoryPicker';
import { GitHubTokenAuthSection } from './GitHubTokenAuthSection';
import { useConnectGitHubWorkspaceForm } from './useConnectGitHubWorkspaceForm';

interface ConnectGitHubWorkspaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialError?: string | null;
}

export const ConnectGitHubWorkspaceDialog: React.FC<
  ConnectGitHubWorkspaceDialogProps
> = ({ isOpen, onClose, initialError }) => {
  const {
    mode,
    selectedConnectionId,
    setSelectedConnectionId,
    token,
    isGitHubConnected,
    availableConnections,
    workspaceName,
    setWorkspaceName,
    repository,
    branch,
    setBranch,
    organization,
    setOrganization,
    isPrivate,
    setIsPrivate,
    repositories,
    isLoadingRepositories,
    hasLoadedRepositories,
    isWorking,
    error,
    userCode,
    authorizationStatus,
    isStartingDeviceAuthorization,
    isCheckingDeviceAuthorization,
    startAuthorization,
    completeAuthorization,
    resetDialog,
    updateRepository,
    selectRepository,
    changeSetupMode,
    handleTokenChange,
    disconnectGitHub,
    handleSetup,
    loadRepositories,
    setConnections,
    setRepositories,
    setHasLoadedRepositories,
  } = useConnectGitHubWorkspaceForm({ isOpen, onClose, initialError });

  return (
    <Dialog
      isOpen={isOpen}
      onClose={resetDialog}
      title="GitHub workspace"
      description="Connect an existing FetchX workspace, or create a repository and sync your current collections."
      className="flex max-h-[calc(100dvh-1.5rem)] flex-col overflow-hidden"
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1.5 pt-2 pb-1.5">
          {error && (
            <Alert variant="destructive" title="GitHub action failed">
              {error}
            </Alert>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={mode === 'connect' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => changeSetupMode('connect')}
            >
              Connect existing
            </Button>
            <Button
              variant={mode === 'create' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => changeSetupMode('create')}
            >
              Create repository
            </Button>
          </div>

          {availableConnections.length > 0 && (
            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <Select
                  label="GitHub connection"
                  value={selectedConnectionId}
                  onChange={(connectionId) => {
                    const connection = availableConnections.find(
                      (item) => item.id === connectionId,
                    );
                    setSelectedConnectionId(connectionId);
                    if (!connection) return;
                    void readStoredGitHubConnectionCredential(
                      connection,
                      availableConnections,
                    ).then((credential) => {
                      if (!credential?.accessToken) return;
                      setConnections((current) => ({
                        ...current,
                        [mode]: {
                          token: credential.accessToken,
                          isGitHubConnected: true,
                        },
                      }));
                      if (mode === 'connect') {
                        void loadRepositories(
                          credential.accessToken,
                          connection.id,
                          false,
                        );
                      }
                    });
                  }}
                  options={availableConnections.map((connection) => ({
                    value: connection.id,
                    label: `${connection.accountLogin} · ${connection.authType === 'oauth' ? 'GitHub App' : 'Personal token'}`,
                  }))}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-[38px] shrink-0"
                title="Connect another GitHub account without removing the selected one"
                onClick={() => {
                  setSelectedConnectionId('');
                  setConnections((current) => ({
                    ...current,
                    [mode]: { token: '', isGitHubConnected: false },
                  }));
                  setRepositories([]);
                  setHasLoadedRepositories(false);
                  void startAuthorization();
                }}
              >
                Add another account
              </Button>
            </div>
          )}

          <GitHubTokenAuthSection
            token={token}
            isGitHubConnected={isGitHubConnected}
            mode={mode}
            userCode={userCode}
            authorizationStatus={authorizationStatus}
            isLoadingRepositories={isLoadingRepositories}
            isStartingDeviceAuthorization={isStartingDeviceAuthorization}
            isCheckingDeviceAuthorization={isCheckingDeviceAuthorization}
            onTokenChange={handleTokenChange}
            onLoadRepositories={() => void loadRepositories(token.trim())}
            onStartDeviceAuthorization={() => void startAuthorization()}
            onCompleteDeviceAuthorization={() => void completeAuthorization()}
            onDisconnectGitHub={disconnectGitHub}
          />

          <Input
            label="Workspace name"
            value={workspaceName}
            onChange={(event) => setWorkspaceName(event.target.value)}
            placeholder={
              mode === 'create' ? 'My API workspace' : 'Optional display name'
            }
          />

          <GitHubRepositoryPicker
            mode={mode}
            repository={repository}
            organization={organization}
            isPrivate={isPrivate}
            repositories={repositories}
            isLoadingRepositories={isLoadingRepositories}
            hasLoadedRepositories={hasLoadedRepositories}
            isGitHubConnected={isGitHubConnected}
            token={token}
            onRepositoryChange={updateRepository}
            onSelectRepository={selectRepository}
            onOrganizationChange={setOrganization}
            onIsPrivateChange={setIsPrivate}
            onReloadRepositories={() => void loadRepositories(token.trim())}
          />

          <Input
            label="Branch"
            value={branch}
            onChange={(event) => setBranch(event.target.value)}
            placeholder="main"
          />
          <p className="text-xs leading-relaxed text-foreground/55">
            FetchX saves GitHub credentials in your desktop keychain. It writes
            collection files under{' '}
            <code className="rounded bg-foreground/5 px-1 py-0.5">
              .fetchx/
            </code>{' '}
            and never commits live responses or local drafts.
          </p>
        </div>
        <div className="mt-3 flex shrink-0 justify-end gap-2 border-t border-foreground/10 pt-3">
          <Button variant="ghost" size="sm" onClick={resetDialog}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={isWorking}
            onClick={() => void handleSetup()}
          >
            {isWorking
              ? 'Working…'
              : mode === 'create'
                ? 'Create and sync'
                : 'Connect workspace'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
