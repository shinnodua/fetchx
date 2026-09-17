import { describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  sha256File,
  validateUpdaterFragment,
  validateUpdaterPublicKey,
  validateVersionAlignment,
} from '../desktop-release-security.ts';

const VALID_PUBLIC_KEY =
  'dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IEQ5NzEyNzg5NUEwM0FFMTAKUldRUXJnTmFpU2R4MmNVVXArK0UxWEZTbUFTTUVYR0wxMTExbHpnNTJXRmk0YnJDOE9FU05rOEUK';

function withTempDirectory(callback: (directory: string) => void) {
  const directory = mkdtempSync(join(tmpdir(), 'fetchx-release-test-'));
  try {
    callback(directory);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

describe('desktop release security validation', () => {
  test('accepts the embedded minisign updater public key format', () => {
    expect(() => validateUpdaterPublicKey(VALID_PUBLIC_KEY)).not.toThrow();
  });

  test('rejects missing or placeholder updater public keys', () => {
    expect(() => validateUpdaterPublicKey()).toThrow(
      'Tauri updater public key is required before releasing.',
    );
    expect(() => validateUpdaterPublicKey('REPLACE_WITH_PUBLIC_KEY')).toThrow(
      'Generate the Tauri updater key and replace the placeholder public key before releasing.',
    );
  });

  test('rejects non-minisign updater public keys', () => {
    expect(() =>
      validateUpdaterPublicKey(
        Buffer.from('not a public key').toString('base64'),
      ),
    ).toThrow(
      'Tauri updater public key must be the base64-encoded minisign public key generated for updater verification.',
    );
  });

  test('requires package, cargo, and Tauri versions to match', () => {
    expect(() =>
      validateVersionAlignment({
        cargoVersion: '0.1.0',
        packageVersion: '0.1.0',
        tauriVersion: '0.1.0',
      }),
    ).not.toThrow();

    expect(() =>
      validateVersionAlignment({
        cargoVersion: '0.1.1',
        packageVersion: '0.1.0',
        tauriVersion: '0.1.0',
      }),
    ).toThrow(
      'package.json, Cargo.toml, and tauri.conf.json versions must match.',
    );
  });

  test('validates updater artifact, signature, URL, and SHA-256 metadata', () => {
    withTempDirectory((directory) => {
      const artifactPath = join(
        directory,
        'fetchx-0.1.0-darwin-aarch64.tar.gz',
      );
      writeFileSync(artifactPath, 'signed update artifact');
      writeFileSync(`${artifactPath}.sig`, 'trusted-signature\n');

      expect(() =>
        validateUpdaterFragment(
          {
            platform: 'darwin-aarch64',
            version: '0.1.0',
            release: {
              sha256: sha256File(artifactPath),
              signature: 'trusted-signature',
              url: 'https://downloads.fetchx.dev/desktop/stable/0.1.0/fetchx-0.1.0-darwin-aarch64.tar.gz',
            },
          },
          {
            artifactDirectory: directory,
            expectedPlatform: 'darwin-aarch64',
            expectedVersion: '0.1.0',
          },
        ),
      ).not.toThrow();
    });
  });

  test('rejects tampered checksum and mismatched signature metadata', () => {
    withTempDirectory((directory) => {
      const artifactPath = join(directory, 'fetchx-0.1.0-windows-x86_64.exe');
      writeFileSync(artifactPath, 'signed update artifact');
      writeFileSync(`${artifactPath}.sig`, 'trusted-signature\n');

      expect(() =>
        validateUpdaterFragment(
          {
            platform: 'windows-x86_64',
            version: '0.1.0',
            release: {
              sha256: 'bad-checksum',
              signature: 'trusted-signature',
              url: 'https://downloads.fetchx.dev/desktop/stable/0.1.0/fetchx-0.1.0-windows-x86_64.exe',
            },
          },
          {
            artifactDirectory: directory,
            expectedPlatform: 'windows-x86_64',
            expectedVersion: '0.1.0',
          },
        ),
      ).toThrow(
        'windows-x86_64.json SHA-256 does not match the updater artifact.',
      );

      expect(() =>
        validateUpdaterFragment(
          {
            platform: 'windows-x86_64',
            version: '0.1.0',
            release: {
              signature: 'different-signature',
              url: 'https://downloads.fetchx.dev/desktop/stable/0.1.0/fetchx-0.1.0-windows-x86_64.exe',
            },
          },
          {
            artifactDirectory: directory,
            expectedPlatform: 'windows-x86_64',
            expectedVersion: '0.1.0',
          },
        ),
      ).toThrow(
        'windows-x86_64.json signature does not match the collected .sig file.',
      );
    });
  });
});
