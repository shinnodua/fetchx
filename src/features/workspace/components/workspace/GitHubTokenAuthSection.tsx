import type React from 'react';
import { Alert, Button, Input } from '../../../../components';
import {
  getGitHubAppInstallationUrl,
  getGitHubTokenTypeLabel,
} from '../../../../services/github';
import { openExternalUrl } from '../../../../services/platform';
import { GitHubDeviceAuthCard } from './GitHubDeviceAuthCard';

export const GITHUB_CREDENTIAL_ACCESS_NOTICE = {
  title: 'Allow secure access when prompted',
  description:
    'FetchX saves your GitHub credential in the system keychain. Your operating system may ask FetchX for access now or when the app reopens. Approve the request to reconnect and sync automatically. On macOS, choose “Always Allow” when the prompt identifies FetchX.',
} as const;

export const shouldShowGitHubCredentialAccessNotice = (
  isGitHubConnected: boolean,
) => !isGitHubConnected;

export const shouldShowGitHubCreateAppInstallationNotice = (
  mode: 'connect' | 'create',
) => mode === 'create';

interface GitHubTokenAuthSectionProps {
  token: string;
  isGitHubConnected: boolean;
  createAppInstallationStatus: 'checking' | 'installed' | 'missing' | null;
  mode: 'connect' | 'create';
  userCode?: string;
  authorizationStatus: string;
  isLoadingRepositories: boolean;
  isStartingDeviceAuthorization: boolean;
  isCheckingDeviceAuthorization: boolean;
  onTokenChange: (token: string) => void;
  onLoadRepositories: () => void;
  onStartDeviceAuthorization: () => void;
  onCompleteDeviceAuthorization: () => void;
  onDisconnectGitHub: () => void;
}

export const GitHubTokenAuthSection: React.FC<GitHubTokenAuthSectionProps> = ({
  token,
  isGitHubConnected,
  createAppInstallationStatus,
  mode,
  userCode,
  authorizationStatus,
  isLoadingRepositories,
  isStartingDeviceAuthorization,
  isCheckingDeviceAuthorization,
  onTokenChange,
  onLoadRepositories,
  onStartDeviceAuthorization,
  onCompleteDeviceAuthorization,
  onDisconnectGitHub,
}) => {
  return (
    <div className="space-y-2">
      {shouldShowGitHubCredentialAccessNotice(isGitHubConnected) && (
        <Alert title={GITHUB_CREDENTIAL_ACCESS_NOTICE.title}>
          {GITHUB_CREDENTIAL_ACCESS_NOTICE.description}
        </Alert>
      )}
      {shouldShowGitHubCreateAppInstallationNotice(mode) && (
        <Alert title="Create App installation required">
          <span>
            GitHub authorization and installation are separate. Install the
            Create App on the personal account or organization that will own the
            repository, then connect the account below.{' '}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 align-baseline text-xs underline"
            onClick={() =>
              void openExternalUrl(getGitHubAppInstallationUrl('create'))
            }
          >
            Install or review access ↗
          </Button>
          {createAppInstallationStatus && (
            <p className="mt-1 text-xs">
              {createAppInstallationStatus === 'checking'
                ? 'Checking installation…'
                : createAppInstallationStatus === 'installed'
                  ? 'Installation verified for this repository owner.'
                  : 'The Create App is not installed for this repository owner.'}
            </p>
          )}
        </Alert>
      )}
      <div className="flex items-end gap-2">
        <Input
          label="GitHub personal access token"
          type="password"
          value={token}
          onChange={(event) => onTokenChange(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === 'Enter' &&
              mode === 'connect' &&
              token.trim() &&
              !isGitHubConnected
            ) {
              event.preventDefault();
              onLoadRepositories();
            }
          }}
          placeholder="Classic or fine-grained token"
          className="min-w-0 flex-1"
          disabled={isGitHubConnected}
        />
        {!isGitHubConnected && token.trim() && mode === 'connect' && (
          <Button
            variant="outline"
            size="sm"
            className="h-[38px] shrink-0"
            isLoading={isLoadingRepositories}
            disabled={isLoadingRepositories}
            onClick={onLoadRepositories}
          >
            Load repositories
          </Button>
        )}
        {isGitHubConnected ? (
          <Button
            variant="outline"
            size="sm"
            className="h-[38px] shrink-0"
            onClick={onDisconnectGitHub}
            title="Disconnect GitHub account"
          >
            Disconnect
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-[38px] shrink-0"
            isLoading={isStartingDeviceAuthorization}
            disabled={isStartingDeviceAuthorization}
            onClick={onStartDeviceAuthorization}
          >
            {userCode ? 'GitHub opened' : 'Connect GitHub'}
          </Button>
        )}
      </div>
      <p className="px-1 text-[11px] text-foreground/55">
        {getGitHubTokenTypeLabel(token)}
      </p>
      {userCode && (
        <GitHubDeviceAuthCard
          userCode={userCode}
          authorizationStatus={authorizationStatus}
          isChecking={isCheckingDeviceAuthorization}
          onCheckNow={onCompleteDeviceAuthorization}
        />
      )}
    </div>
  );
};
