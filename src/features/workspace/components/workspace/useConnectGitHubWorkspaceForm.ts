import { useCallback, useEffect, useState } from 'react';
import {
  createStoredCredentialFromAuth,
  type GitHubRepository,
  type GitHubStoredCredential,
  getGitHubAppClientId,
  listGitHubRepositories,
} from '../../../../services/github';
import { useWorkspaceStore } from '../../../../store';
import type { GitHubConnectionDescriptor } from '../../../../store/workspace/workspaceStoreTypes';
import { useConnectGitHubWorkspace } from '../../hooks/useConnectGitHubWorkspace';
import { useGitHubDeviceFlow } from '../../hooks/useGitHubDeviceFlow';
import { getGitHubActionError } from '../../utils/workspaceSelectorUtils';
import {
  createGitHubConnectionRecord,
  disconnectGitHubStoredConnection,
  type GitHubConnectionsByMode,
  INITIAL_GITHUB_CONNECTIONS_BY_MODE,
  loadStoredGitHubCredentials,
  readStoredGitHubConnectionCredential,
  type SetupMode,
} from './connectGitHubWorkspaceUtils';
import { useGitHubWorkspaceFields } from './useGitHubWorkspaceFields';
import { useReloadGitHubRepositoriesOnFocus } from './useReloadGitHubRepositoriesOnFocus';

export type { SetupMode };

interface UseConnectGitHubWorkspaceFormParams {
  isOpen: boolean;
  onClose: () => void;
  initialError?: string | null;
}

export function useConnectGitHubWorkspaceForm({
  isOpen,
  onClose,
  initialError,
}: UseConnectGitHubWorkspaceFormParams) {
  const {
    activeWorkspaceId,
    githubConnections,
    removeGitHubConnection,
    upsertGitHubConnection,
    workspaces,
  } = useWorkspaceStore();
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const [mode, setMode] = useState<SetupMode>('connect');
  const [selectedConnectionId, setSelectedConnectionId] = useState('');
  const [connections, setConnections] = useState<GitHubConnectionsByMode>(
    INITIAL_GITHUB_CONNECTIONS_BY_MODE,
  );
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [isLoadingRepositories, setIsLoadingRepositories] = useState(false);
  const [hasLoadedRepositories, setHasLoadedRepositories] = useState(false);

  const { isWorking, error, setError, connectWorkspace } =
    useConnectGitHubWorkspace(initialError);
  const {
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
    selectRepository: selectRepo,
  } = useGitHubWorkspaceFields({ activeWorkspace, isOpen, initialError });

  const selectRepository = useCallback(
    (fullName: string) => selectRepo(fullName, repositories),
    [repositories, selectRepo],
  );

  const activeConnection = connections[mode];
  const token = activeConnection.token;
  const isGitHubConnected = activeConnection.isGitHubConnected;
  const availableConnections = githubConnections.filter(
    (connection) => connection.mode === mode,
  );
  const selectedConnection = availableConnections.find(
    (connection) => connection.id === selectedConnectionId,
  );

  const createConnection = useCallback(
    async (
      accessToken: string,
      authType: GitHubConnectionDescriptor['authType'],
      credential?: GitHubStoredCredential,
    ) => {
      const connection = await createGitHubConnectionRecord(
        accessToken,
        authType,
        mode,
        credential,
        githubConnections,
      );
      upsertGitHubConnection(connection);
      setSelectedConnectionId(connection.id);
      return connection;
    },
    [githubConnections, mode, upsertGitHubConnection],
  );

  const loadRepositories = useCallback(
    async (
      accessToken: string,
      connectionId = selectedConnectionId,
      createPatConnection = true,
    ) => {
      if (!accessToken.trim()) return;
      setIsLoadingRepositories(true);
      setError(null);
      try {
        const normalizedToken = accessToken.trim();
        setRepositories(await listGitHubRepositories(normalizedToken));
        if (!connectionId && createPatConnection) {
          await createConnection(normalizedToken, 'pat');
        }
        setConnections((current) => ({
          ...current,
          [mode]: { token: normalizedToken, isGitHubConnected: true },
        }));
        setHasLoadedRepositories(true);
      } catch (repositoryError) {
        setRepositories([]);
        setHasLoadedRepositories(false);
        setError(
          getGitHubActionError(
            repositoryError,
            'Could not load GitHub repositories.',
          ),
        );
      } finally {
        setIsLoadingRepositories(false);
      }
    },
    [createConnection, mode, selectedConnectionId, setError],
  );

  const {
    userCode,
    authorizationStatus,
    isStartingDeviceAuthorization,
    isCheckingDeviceAuthorization,
    startAuthorization,
    completeAuthorization,
    resetDeviceAuthorization,
  } = useGitHubDeviceFlow({
    mode,
    onAuthorized: async (authorizedToken) => {
      const clientId = getGitHubAppClientId(mode);
      const storedCred = createStoredCredentialFromAuth(authorizedToken, {
        clientId,
        mode,
      });
      const connection = await createConnection(
        authorizedToken.accessToken,
        'oauth',
        storedCred,
      );

      setConnections((prev) => ({
        ...prev,
        [mode]: {
          token: authorizedToken.accessToken,
          isGitHubConnected: true,
        },
      }));
      setError(null);
      if (mode === 'connect') {
        await loadRepositories(
          authorizedToken.accessToken,
          connection.id,
          false,
        );
      }
    },
    onError: setError,
    onClearRepositories: () => {
      setRepositories([]);
      setHasLoadedRepositories(false);
    },
  });

  useEffect(() => {
    if (!isOpen) return;

    let isCancelled = false;
    const loadStored = async () => {
      const stored = await loadStoredGitHubCredentials(githubConnections);
      if (isCancelled) return;

      const matching = githubConnections.find(
        (connection) => connection.mode === mode,
      );
      const matchingCred = stored.find(
        (entry) => entry.connection.id === matching?.id,
      )?.credential;

      setSelectedConnectionId(matching?.id || '');
      setConnections((current) => ({
        ...current,
        [mode]: {
          token: matchingCred?.accessToken || '',
          isGitHubConnected: Boolean(matchingCred?.accessToken),
        },
      }));

      if (mode === 'connect' && matchingCred?.accessToken) {
        void loadRepositories(matchingCred.accessToken, matching?.id, false);
      }
    };

    void loadStored();
    return () => {
      isCancelled = true;
    };
  }, [githubConnections, isOpen, loadRepositories, mode]);

  useReloadGitHubRepositoriesOnFocus({
    isOpen,
    isGitHubConnected,
    mode,
    repositoriesCount: repositories.length,
    token,
    loadRepositories,
  });

  const resetDialog = useCallback(() => {
    setError(null);
    onClose();
  }, [onClose, setError]);

  const changeSetupMode = useCallback(
    (nextMode: SetupMode) => {
      if (nextMode === mode) return;
      setMode(nextMode);
      setError(null);
      resetDeviceAuthorization();
      if (
        nextMode === 'connect' &&
        connections.connect.token.trim() &&
        repositories.length === 0 &&
        !hasLoadedRepositories
      ) {
        void loadRepositories(connections.connect.token.trim());
      }
    },
    [
      connections.connect.token,
      hasLoadedRepositories,
      loadRepositories,
      mode,
      repositories.length,
      resetDeviceAuthorization,
      setError,
    ],
  );

  const handleTokenChange = useCallback(
    (updatedToken: string) => {
      setConnections((prev) => ({
        ...prev,
        [mode]: { token: updatedToken, isGitHubConnected: false },
      }));
    },
    [mode],
  );

  const disconnectGitHub = useCallback(async () => {
    await disconnectGitHubStoredConnection(
      selectedConnection,
      removeGitHubConnection,
    );
    setConnections((prev) => ({
      ...prev,
      [mode]: { token: '', isGitHubConnected: false },
    }));
    if (mode === 'connect') {
      setRepositories([]);
      setHasLoadedRepositories(false);
      setRepository('');
    }
    resetDeviceAuthorization();
    setError(null);
  }, [
    mode,
    removeGitHubConnection,
    resetDeviceAuthorization,
    selectedConnection,
    setError,
    setRepository,
  ]);

  const handleSetup = useCallback(async () => {
    let connection = selectedConnection;
    let connectionToken = token.trim();
    try {
      connection ||= token.trim()
        ? await createConnection(token.trim(), 'pat')
        : undefined;
      if (connection) {
        const credential = await readStoredGitHubConnectionCredential(
          connection,
          githubConnections,
        );
        connectionToken = credential?.accessToken || connectionToken;
      }
    } catch (connectionError) {
      setError(
        getGitHubActionError(
          connectionError,
          'Could not create the GitHub connection.',
        ),
      );
      return;
    }
    if (!connection) {
      setError('Connect a GitHub account or enter a personal access token.');
      return;
    }
    if (!connectionToken) {
      setError(
        `The saved credential for ${connection.accountLogin} is unavailable. Reconnect this account to continue.`,
      );
      return;
    }
    await connectWorkspace({
      mode,
      connectionId: connection.id,
      credentialKey: connection.credentialKey,
      token: connectionToken,
      repository,
      branch,
      workspaceName,
      organization,
      isPrivate,
      onSuccess: resetDialog,
    });
  }, [
    branch,
    connectWorkspace,
    createConnection,
    isPrivate,
    mode,
    organization,
    repository,
    resetDialog,
    selectedConnection,
    setError,
    token,
    workspaceName,
    githubConnections,
  ]);

  return {
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
  };
}
