import {
  readGitHubCredential,
  removeGitHubCredential,
  saveGitHubCredential,
} from '../platform';
import {
  type GitHubAuthToken,
  getGitHubAppClientId,
  refreshGitHubToken,
} from './githubDeviceAuth';

export interface GitHubStoredCredential {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  refreshTokenExpiresAt?: number;
  tokenType?: string;
  scope?: string;
  clientId?: string;
  mode?: 'connect' | 'create';
  updatedAt?: number;
}

export const getGitHubConnectionCredentialKey = (
  mode: 'connect' | 'create',
): string => `connection.${mode}`;

export const serializeGitHubCredential = (
  credential: GitHubStoredCredential,
): string => JSON.stringify(credential);

export const parseGitHubCredential = (
  raw: string | null | undefined,
): GitHubStoredCredential | null => {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.accessToken === 'string' &&
      parsed.accessToken.trim()
    ) {
      return {
        accessToken: parsed.accessToken.trim(),
        refreshToken:
          typeof parsed.refreshToken === 'string' && parsed.refreshToken.trim()
            ? parsed.refreshToken.trim()
            : undefined,
        expiresAt:
          typeof parsed.expiresAt === 'number' ? parsed.expiresAt : undefined,
        refreshTokenExpiresAt:
          typeof parsed.refreshTokenExpiresAt === 'number'
            ? parsed.refreshTokenExpiresAt
            : undefined,
        tokenType:
          typeof parsed.tokenType === 'string' ? parsed.tokenType : undefined,
        scope: typeof parsed.scope === 'string' ? parsed.scope : undefined,
        clientId:
          typeof parsed.clientId === 'string' ? parsed.clientId : undefined,
        mode:
          parsed.mode === 'connect' || parsed.mode === 'create'
            ? parsed.mode
            : undefined,
        updatedAt:
          typeof parsed.updatedAt === 'number' ? parsed.updatedAt : undefined,
      };
    }
  } catch {
    // Fallback: it's a plain token string (such as classic or fine-grained PAT)
  }
  return {
    accessToken: raw.trim(),
  };
};

export const isGitHubTokenExpiredOrExpiringSoon = (
  credential: GitHubStoredCredential,
  thresholdMs = 5 * 60 * 1000,
): boolean => {
  if (!credential.expiresAt) {
    return false;
  }
  return Date.now() + thresholdMs >= credential.expiresAt;
};

export const createStoredCredentialFromAuth = (
  token: GitHubAuthToken,
  options?: {
    clientId?: string;
    mode?: 'connect' | 'create';
  },
): GitHubStoredCredential => {
  const now = Date.now();
  return {
    accessToken: token.accessToken.trim(),
    refreshToken: token.refreshToken?.trim() || undefined,
    expiresAt: token.expiresIn ? now + token.expiresIn * 1_000 : undefined,
    refreshTokenExpiresAt: token.refreshTokenExpiresIn
      ? now + token.refreshTokenExpiresIn * 1_000
      : undefined,
    tokenType: token.tokenType,
    scope: token.scope,
    clientId: options?.clientId,
    mode: options?.mode,
    updatedAt: now,
  };
};

export const saveGitHubStoredCredential = async (
  credentialKey: string,
  credential: GitHubStoredCredential,
): Promise<void> => {
  const payload = serializeGitHubCredential({
    ...credential,
    updatedAt: Date.now(),
  });
  await saveGitHubCredential(credentialKey, payload);
};

export const readGitHubStoredCredential = async (
  credentialKey: string,
): Promise<GitHubStoredCredential | null> => {
  const raw = await readGitHubCredential(credentialKey);
  return parseGitHubCredential(raw);
};

export const removeGitHubStoredCredential = async (
  credentialKey: string,
): Promise<void> => {
  await removeGitHubCredential(credentialKey);
};

export const refreshStoredGitHubCredential = async (
  credentialKey: string,
  existingCredential?: GitHubStoredCredential | null,
): Promise<GitHubStoredCredential | null> => {
  const credential =
    existingCredential ?? (await readGitHubStoredCredential(credentialKey));
  if (!credential?.refreshToken) {
    return null;
  }

  const clientId =
    credential.clientId ||
    (credential.mode ? getGitHubAppClientId(credential.mode) : undefined) ||
    getGitHubAppClientId('connect');

  if (!clientId) {
    return null;
  }

  const refreshedToken = await refreshGitHubToken(
    clientId,
    credential.refreshToken,
  );
  const updatedCredential: GitHubStoredCredential = {
    ...credential,
    accessToken: refreshedToken.accessToken,
    refreshToken: refreshedToken.refreshToken ?? credential.refreshToken,
    expiresAt: refreshedToken.expiresIn
      ? Date.now() + refreshedToken.expiresIn * 1_000
      : undefined,
    refreshTokenExpiresAt: refreshedToken.refreshTokenExpiresIn
      ? Date.now() + refreshedToken.refreshTokenExpiresIn * 1_000
      : undefined,
    tokenType: refreshedToken.tokenType ?? credential.tokenType,
    scope: refreshedToken.scope ?? credential.scope,
    clientId,
    updatedAt: Date.now(),
  };

  await saveGitHubStoredCredential(credentialKey, updatedCredential);
  return updatedCredential;
};

export const ensureValidGitHubCredential = async (
  credentialKey: string,
): Promise<GitHubStoredCredential | null> => {
  const credential = await readGitHubStoredCredential(credentialKey);
  if (!credential) return null;

  if (
    credential.refreshToken &&
    isGitHubTokenExpiredOrExpiringSoon(credential)
  ) {
    try {
      const refreshed = await refreshStoredGitHubCredential(
        credentialKey,
        credential,
      );
      if (refreshed) return refreshed;
    } catch {
      // If auto-refresh fails before a call, fall back to the existing credential
      // In case the token is still valid on GitHub's side.
    }
  }

  return credential;
};

export const saveGitHubConnectionCredential = async (
  mode: 'connect' | 'create',
  accessToken: string,
): Promise<GitHubStoredCredential> => {
  const normalizedToken = accessToken.trim();
  const credentialKey = getGitHubConnectionCredentialKey(mode);
  const existingCredential = await ensureValidGitHubCredential(
    credentialKey,
  ).catch(() => null);

  if (existingCredential?.accessToken === normalizedToken) {
    return existingCredential;
  }

  const credential: GitHubStoredCredential = {
    accessToken: normalizedToken,
    mode,
  };
  await saveGitHubStoredCredential(credentialKey, credential);
  return credential;
};

export const resolveWorkspaceGitHubCredential = async (options: {
  credentialKey?: string;
  repository?: string;
  mode?: 'connect' | 'create';
}): Promise<{
  credential: GitHubStoredCredential;
  credentialKey: string;
} | null> => {
  const candidateKeys: string[] = [];
  if (options.credentialKey?.trim()) {
    candidateKeys.push(options.credentialKey.trim());
  }
  if (options.repository?.trim()) {
    const sanitized = options.repository
      .trim()
      .replace(/[^a-zA-Z0-9_.-]/g, '_');
    if (!candidateKeys.includes(sanitized)) {
      candidateKeys.push(sanitized);
    }
  }
  if (options.mode) {
    const connectionKey = getGitHubConnectionCredentialKey(options.mode);
    if (!candidateKeys.includes(connectionKey)) {
      candidateKeys.push(connectionKey);
    }
  }

  for (const key of candidateKeys) {
    try {
      const cred = await ensureValidGitHubCredential(key);
      if (cred?.accessToken) {
        return { credential: cred, credentialKey: key };
      }
    } catch {
      // Continue checking next candidate key
    }
  }

  return null;
};
