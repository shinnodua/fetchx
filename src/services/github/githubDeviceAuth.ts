import {
  type GitHubAuthToken,
  isDesktopApp,
  openExternalUrl,
  refreshGitHubToken as refreshGitHubTokenDesktop,
} from '../platform';

export type { GitHubAuthToken };

const GITHUB_DEVICE_CODE_URL = 'https://github.com/login/device/code';
const GITHUB_ACCESS_TOKEN_URL = 'https://github.com/login/oauth/access_token';

export interface GitHubDeviceAuthorization {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  expiresIn: number;
  interval: number;
}

export const getGitHubAppClientId = (mode: 'connect' | 'create') =>
  mode === 'create'
    ? import.meta.env.VITE_GITHUB_CREATE_CLIENT_ID?.trim()
    : import.meta.env.VITE_GITHUB_SYNC_CLIENT_ID?.trim();

export const getGitHubAppSlug = (mode: 'connect' | 'create') =>
  mode === 'create'
    ? import.meta.env.VITE_GITHUB_CREATE_APP_SLUG?.trim() || 'fetchx-create'
    : import.meta.env.VITE_GITHUB_SYNC_APP_SLUG?.trim() || 'fetchx-sync';

export const getGitHubAppInstallationUrl = (mode: 'connect' | 'create') => {
  const slug = getGitHubAppSlug(mode);
  return `https://github.com/apps/${slug}/installations/new`;
};

interface DeviceAuthorizationResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

interface DeviceTokenResponse {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }
  return '';
};

export const isGitHubAuthorizationPending = (error: unknown) => {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes('authorization_pending') ||
    message.includes('authorization is still pending')
  );
};

const formHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/x-www-form-urlencoded',
};

export const startGitHubDeviceAuthorization = async (clientId: string) => {
  if (isDesktopApp()) {
    const { invoke } = await import('@tauri-apps/api/core');
    const body = await invoke<GitHubDeviceAuthorization>(
      'start_github_device_authorization',
      { clientId },
    );
    await openExternalUrl(body.verificationUri);
    return body;
  }
  const response = await fetch(GITHUB_DEVICE_CODE_URL, {
    method: 'POST',
    headers: formHeaders,
    body: new URLSearchParams({ client_id: clientId }),
  });
  if (!response.ok) throw new Error('GitHub could not start authorization.');
  const body = (await response.json()) as DeviceAuthorizationResponse;
  await openExternalUrl(body.verification_uri);
  return {
    deviceCode: body.device_code,
    userCode: body.user_code,
    verificationUri: body.verification_uri,
    expiresIn: body.expires_in,
    interval: body.interval,
  } satisfies GitHubDeviceAuthorization;
};

export const completeGitHubDeviceAuthorization = async (
  clientId: string,
  deviceCode: string,
): Promise<GitHubAuthToken> => {
  if (isDesktopApp()) {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<GitHubAuthToken>('complete_github_device_authorization', {
      clientId,
      deviceCode,
    });
  }
  const response = await fetch(GITHUB_ACCESS_TOKEN_URL, {
    method: 'POST',
    headers: formHeaders,
    body: new URLSearchParams({
      client_id: clientId,
      device_code: deviceCode,
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
    }),
  });
  if (!response.ok) throw new Error('GitHub could not finish authorization.');
  const body = (await response.json()) as DeviceTokenResponse;
  if (body.access_token) {
    return {
      accessToken: body.access_token,
      expiresIn: body.expires_in,
      refreshToken: body.refresh_token,
      refreshTokenExpiresIn: body.refresh_token_expires_in,
      tokenType: body.token_type,
      scope: body.scope,
    };
  }
  if (body.error === 'authorization_pending') {
    throw new Error(
      'Authorization is still pending. Complete it in GitHub, then try again.',
    );
  }
  throw new Error(
    body.error_description || 'GitHub authorization was not completed.',
  );
};

export const refreshGitHubToken = async (
  clientId: string,
  refreshToken: string,
): Promise<GitHubAuthToken> => {
  if (isDesktopApp()) {
    return refreshGitHubTokenDesktop(clientId, refreshToken);
  }
  const response = await fetch(GITHUB_ACCESS_TOKEN_URL, {
    method: 'POST',
    headers: formHeaders,
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });
  if (!response.ok) throw new Error('GitHub could not refresh token.');
  const body = (await response.json()) as DeviceTokenResponse;
  if (body.access_token) {
    return {
      accessToken: body.access_token,
      expiresIn: body.expires_in,
      refreshToken: body.refresh_token ?? refreshToken,
      refreshTokenExpiresIn: body.refresh_token_expires_in,
      tokenType: body.token_type,
      scope: body.scope,
    };
  }
  throw new Error(
    body.error_description || body.error || 'GitHub token refresh failed.',
  );
};
