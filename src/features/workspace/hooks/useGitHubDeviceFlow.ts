import { useCallback, useEffect, useState } from 'react';
import {
  completeGitHubDeviceAuthorization,
  type GitHubAuthToken,
  type GitHubDeviceAuthorization,
  getGitHubAppClientId,
  isGitHubAuthorizationPending,
  startGitHubDeviceAuthorization,
} from '../../../services/github';

interface UseGitHubDeviceFlowOptions {
  mode: 'connect' | 'create';
  onAuthorized: (token: GitHubAuthToken) => void | Promise<void>;
  onError: (error: string) => void;
  onClearRepositories?: () => void;
}

export const useGitHubDeviceFlow = ({
  mode,
  onAuthorized,
  onError,
  onClearRepositories,
}: UseGitHubDeviceFlowOptions) => {
  const [deviceAuthorization, setDeviceAuthorization] =
    useState<GitHubDeviceAuthorization | null>(null);
  const [authorizationStatus, setAuthorizationStatus] = useState('');
  const [isStartingDeviceAuthorization, setIsStartingDeviceAuthorization] =
    useState(false);
  const [isCheckingDeviceAuthorization, setIsCheckingDeviceAuthorization] =
    useState(false);

  const resetDeviceAuthorization = useCallback(() => {
    setDeviceAuthorization(null);
    setAuthorizationStatus('');
  }, []);

  const startAuthorization = useCallback(async () => {
    onClearRepositories?.();
    setIsStartingDeviceAuthorization(true);
    try {
      const clientId = getGitHubAppClientId(mode);
      if (!clientId) {
        throw new Error(
          mode === 'create'
            ? 'GitHub Create App client ID is not configured.'
            : 'GitHub Sync App client ID is not configured.',
        );
      }
      const authorization = await startGitHubDeviceAuthorization(clientId);
      setDeviceAuthorization(authorization);
      setAuthorizationStatus(
        `Waiting for GitHub approval. Checking every ${Math.max(authorization.interval, 5)} seconds.`,
      );
    } catch (authError) {
      onError(
        authError instanceof Error
          ? authError.message
          : 'Could not start GitHub authorization.',
      );
    } finally {
      setIsStartingDeviceAuthorization(false);
    }
  }, [mode, onClearRepositories, onError]);

  const completeAuthorization = useCallback(
    async (isAutomatic = false) => {
      if (!deviceAuthorization) return 'failed' as const;
      setIsCheckingDeviceAuthorization(true);
      if (isAutomatic) {
        setAuthorizationStatus('Checking GitHub authorization…');
      }
      try {
        const clientId = getGitHubAppClientId(mode);
        if (!clientId) {
          throw new Error(
            mode === 'create'
              ? 'GitHub Create App client ID is not configured.'
              : 'GitHub Sync App client ID is not configured.',
          );
        }
        const authorizedToken = await completeGitHubDeviceAuthorization(
          clientId,
          deviceAuthorization.deviceCode,
        );
        resetDeviceAuthorization();
        await onAuthorized(authorizedToken);
        return 'completed' as const;
      } catch (authError) {
        const isPending = isGitHubAuthorizationPending(authError);
        if (isPending) {
          setAuthorizationStatus(
            `Still waiting for GitHub approval. Checking every ${Math.max(deviceAuthorization.interval, 5)} seconds.`,
          );
        }
        if (!isAutomatic || !isPending) {
          onError(
            authError instanceof Error
              ? authError.message
              : 'GitHub authorization failed.',
          );
        }
        return isPending ? ('pending' as const) : ('failed' as const);
      } finally {
        setIsCheckingDeviceAuthorization(false);
      }
    },
    [
      deviceAuthorization,
      mode,
      onError,
      onAuthorized,
      resetDeviceAuthorization,
    ],
  );

  useEffect(() => {
    if (!deviceAuthorization) return;

    let cancelled = false;
    const expiresAt = Date.now() + deviceAuthorization.expiresIn * 1_000;
    const interval = Math.max(deviceAuthorization.interval, 5) * 1_000;
    let timeoutId: number | undefined;

    const pollAuthorization = async () => {
      if (cancelled) return;
      if (Date.now() >= expiresAt) {
        resetDeviceAuthorization();
        onError('The GitHub device code expired. Connect GitHub to try again.');
        return;
      }
      const status = await completeAuthorization(true);
      if (!cancelled && status === 'pending') {
        timeoutId = window.setTimeout(pollAuthorization, interval);
      }
    };

    timeoutId = window.setTimeout(pollAuthorization, interval);
    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [
    deviceAuthorization,
    completeAuthorization,
    onError,
    resetDeviceAuthorization,
  ]);

  return {
    deviceAuthorization,
    userCode: deviceAuthorization?.userCode,
    authorizationStatus,
    isStartingDeviceAuthorization,
    isCheckingDeviceAuthorization,
    startAuthorization,
    completeAuthorization,
    resetDeviceAuthorization,
  };
};
