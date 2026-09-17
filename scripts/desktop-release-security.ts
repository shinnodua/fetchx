import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';

export interface VersionSources {
  cargoVersion?: string;
  packageVersion: string;
  tauriVersion: string;
}

export interface UpdaterPlatformRelease {
  sha256?: string;
  signature: string;
  url: string;
}

export interface UpdaterArtifactFragment {
  platform: string;
  release: UpdaterPlatformRelease;
  version: string;
}

const PLACEHOLDER_PUBLIC_KEY_PREFIX = 'REPLACE_WITH_';
const TRUSTED_COMMENT = 'untrusted comment: minisign public key:';

export function validateVersionAlignment({
  cargoVersion,
  packageVersion,
  tauriVersion,
}: VersionSources) {
  if (packageVersion !== tauriVersion || packageVersion !== cargoVersion) {
    throw new Error(
      'package.json, Cargo.toml, and tauri.conf.json versions must match.',
    );
  }
}

export function validateUpdaterPublicKey(publicKey?: string) {
  if (!publicKey) {
    throw new Error('Tauri updater public key is required before releasing.');
  }
  if (publicKey.startsWith(PLACEHOLDER_PUBLIC_KEY_PREFIX)) {
    throw new Error(
      'Generate the Tauri updater key and replace the placeholder public key before releasing.',
    );
  }

  let decoded: string;
  try {
    decoded = Buffer.from(publicKey, 'base64').toString('utf8');
  } catch {
    throw new Error('Tauri updater public key must be base64 encoded.');
  }

  if (!decoded.includes(TRUSTED_COMMENT) || !decoded.includes('\nRW')) {
    throw new Error(
      'Tauri updater public key must be the base64-encoded minisign public key generated for updater verification.',
    );
  }
}

export function sha256File(path: string) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

export function validateUpdaterFragment(
  fragment: UpdaterArtifactFragment,
  options: {
    artifactDirectory: string;
    expectedPlatform: string;
    expectedVersion: string;
  },
) {
  const { artifactDirectory, expectedPlatform, expectedVersion } = options;
  if (
    fragment.platform !== expectedPlatform ||
    fragment.version !== expectedVersion
  ) {
    throw new Error(
      `${expectedPlatform}.json does not match version ${expectedVersion}.`,
    );
  }
  if (!fragment.release.url.startsWith('https://downloads.fetchx.dev/')) {
    throw new Error(`${expectedPlatform}.json must use downloads.fetchx.dev.`);
  }
  if (!fragment.release.signature.trim()) {
    throw new Error(
      `${expectedPlatform}.json is missing an updater signature.`,
    );
  }

  const updaterName = basename(new URL(fragment.release.url).pathname);
  const artifactPath = join(artifactDirectory, updaterName);
  const signaturePath = join(artifactDirectory, `${updaterName}.sig`);
  if (!existsSync(artifactPath) || !existsSync(signaturePath)) {
    throw new Error(
      `Missing updater artifact or signature for ${expectedPlatform}.`,
    );
  }

  const signature = readFileSync(signaturePath, 'utf8').trim();
  if (!signature) {
    throw new Error(`Updater signature file is empty for ${expectedPlatform}.`);
  }
  if (signature !== fragment.release.signature.trim()) {
    throw new Error(
      `${expectedPlatform}.json signature does not match the collected .sig file.`,
    );
  }

  if (fragment.release.sha256) {
    const actualSha256 = sha256File(artifactPath);
    if (fragment.release.sha256 !== actualSha256) {
      throw new Error(
        `${expectedPlatform}.json SHA-256 does not match the updater artifact.`,
      );
    }
  }
}
