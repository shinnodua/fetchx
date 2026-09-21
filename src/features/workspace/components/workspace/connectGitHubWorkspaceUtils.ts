import {
  ensureValidGitHubCredential,
  type GitHubStoredCredential,
  getGitHubAccount,
  removeGitHubStoredCredential,
  saveGitHubStoredCredential,
} from '../../../../services/github';
import type { GitHubConnectionDescriptor } from '../../../../store/workspace/workspaceStoreTypes';

export type SetupMode = 'connect' | 'create';

export const canMigrateLegacyModeCredential = (
  connection: GitHubConnectionDescriptor,
  connections: GitHubConnectionDescriptor[],
) => connections.filter((item) => item.mode === connection.mode).length === 1;

export const canMirrorModeCredential = (
  connection: GitHubConnectionDescriptor,
  connections: GitHubConnectionDescriptor[],
) =>
  connections
    .filter((item) => item.mode === connection.mode)
    .every((item) => item.id === connection.id);

export type GitHubConnectionsByMode = Record<
  SetupMode,
  { token: string; isGitHubConnected: boolean }
>;

export const INITIAL_GITHUB_CONNECTIONS_BY_MODE: GitHubConnectionsByMode = {
  connect: { token: '', isGitHubConnected: false },
  create: { token: '', isGitHubConnected: false },
};

export const getSavedGitHubConnectionForMode = (
  connections: GitHubConnectionDescriptor[],
  mode: SetupMode,
) => connections.find((connection) => connection.mode === mode);

export async function readSavedGitHubConnectionForMode(
  connections: GitHubConnectionDescriptor[],
  mode: SetupMode,
): Promise<{
  connection: GitHubConnectionDescriptor;
  credential: GitHubStoredCredential | null;
} | null> {
  const connection = getSavedGitHubConnectionForMode(connections, mode);
  if (!connection) return null;
  const credential = await readStoredGitHubConnectionCredential(
    connection,
    connections,
  ).catch(() => null);
  return { connection, credential };
}

export function getGitHubConnectionForAccount(
  account: { id: string; login: string },
  authType: GitHubConnectionDescriptor['authType'],
  mode: SetupMode,
  existingConnections: GitHubConnectionDescriptor[],
  credential?: GitHubStoredCredential,
): GitHubConnectionDescriptor {
  const existing = existingConnections.find(
    (connection) =>
      connection.accountId === account.id && connection.mode === mode,
  );
  if (existing) {
    return {
      ...existing,
      accountLogin: account.login,
      authType,
      expiresAt: credential?.expiresAt,
    };
  }

  const id = `github-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    accountId: account.id,
    accountLogin: account.login,
    mode,
    authType,
    credentialKey: `connection.${id}`,
    expiresAt: credential?.expiresAt,
  };
}

export async function createGitHubConnectionRecord(
  accessToken: string,
  authType: GitHubConnectionDescriptor['authType'],
  mode: SetupMode,
  credential?: GitHubStoredCredential,
  existingConnections: GitHubConnectionDescriptor[] = [],
): Promise<GitHubConnectionDescriptor> {
  const account = await getGitHubAccount(accessToken);
  const connection = getGitHubConnectionForAccount(
    account,
    authType,
    mode,
    existingConnections,
    credential,
  );
  await saveGitHubStoredCredential(
    connection.credentialKey,
    credential ?? { accessToken: accessToken.trim(), mode },
  );
  // Support older desktop credential entries while this mode has only one
  // account. The fallback is disabled automatically as soon as a second
  // account exists, so it can never select the wrong account for sync.
  if (canMirrorModeCredential(connection, existingConnections)) {
    await saveGitHubStoredCredential(
      `connection.${connection.mode}`,
      credential ?? { accessToken: accessToken.trim(), mode },
    );
  }
  return connection;
}

export async function readStoredGitHubConnectionCredential(
  connection: GitHubConnectionDescriptor,
  connections: GitHubConnectionDescriptor[],
): Promise<GitHubStoredCredential | null> {
  const credential = await ensureValidGitHubCredential(
    connection.credentialKey,
  );
  if (credential || !canMigrateLegacyModeCredential(connection, connections)) {
    return credential;
  }

  const legacyCredential = await ensureValidGitHubCredential(
    `connection.${connection.mode}`,
  );
  if (!legacyCredential) return null;

  // Keep the existing, mode-scoped credential usable if a one-time copy into
  // the account-scoped key cannot be completed. This prevents a workspace
  // from being disconnected solely because credential-store migration failed.
  await saveGitHubStoredCredential(
    connection.credentialKey,
    legacyCredential,
  ).catch(() => {});
  return legacyCredential;
}

export async function disconnectGitHubStoredConnection(
  selectedConnection: GitHubConnectionDescriptor | undefined,
  removeGitHubConnection: (id: string) => void,
): Promise<void> {
  if (selectedConnection) {
    await removeGitHubStoredCredential(selectedConnection.credentialKey).catch(
      () => {},
    );
    removeGitHubConnection(selectedConnection.id);
  }
}
