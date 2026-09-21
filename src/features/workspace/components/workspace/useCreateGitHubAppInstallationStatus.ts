import { useCallback, useEffect, useState } from 'react';
import {
  getGitHubAppSlug,
  hasGitHubAppInstallation,
} from '../../../../services/github';
import type { GitHubConnectionDescriptor } from '../../../../store/workspace/workspaceStoreTypes';
import type { SetupMode } from './connectGitHubWorkspaceUtils';

export type CreateAppInstallationStatus =
  | 'checking'
  | 'installed'
  | 'missing'
  | null;

export function useCreateGitHubAppInstallationStatus(options: {
  isOpen: boolean;
  mode: SetupMode;
  organization: string;
  connection?: GitHubConnectionDescriptor;
  token: string;
}) {
  const { isOpen, mode, organization, connection, token } = options;
  const [status, setStatus] = useState<CreateAppInstallationStatus>(null);

  const checkInstallation = useCallback(async () => {
    const owner = organization.trim() || connection?.accountLogin;
    if (
      mode !== 'create' ||
      connection?.authType !== 'oauth' ||
      !token.trim() ||
      !owner
    ) {
      setStatus(null);
      return;
    }
    setStatus('checking');
    try {
      const installed = await hasGitHubAppInstallation(
        token.trim(),
        getGitHubAppSlug('create'),
        owner,
      );
      setStatus(installed ? 'installed' : 'missing');
    } catch {
      setStatus(null);
    }
  }, [connection, mode, organization, token]);

  useEffect(() => {
    if (!isOpen || mode !== 'create') return;
    void checkInstallation();
    const handleFocus = () => void checkInstallation();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [checkInstallation, isOpen, mode]);

  return status;
}
