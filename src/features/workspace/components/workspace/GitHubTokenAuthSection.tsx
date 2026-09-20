import type React from 'react';
import { Button, Input } from '../../../../components';
import { getGitHubTokenTypeLabel } from '../../../../services/github';
import { GitHubDeviceAuthCard } from './GitHubDeviceAuthCard';

interface GitHubTokenAuthSectionProps {
  token: string;
  isGitHubConnected: boolean;
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
    <div className="space-y-1">
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
