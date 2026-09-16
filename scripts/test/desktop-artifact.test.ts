import { describe, expect, test } from 'bun:test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createManifest } from '../desktop-artifact.ts';

function withTempDirectory(callback: (directory: string) => void) {
  const directory = mkdtempSync(join(tmpdir(), 'call3-artifact-test-'));
  try {
    callback(directory);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

describe('desktop artifact manifest creation', () => {
  test('ignores a prior stable manifest when validating new release fragments', () => {
    withTempDirectory((directory) => {
      const outputFile = join(directory, 'stable.json');
      const existingManifestFile = join(directory, 'existing-stable.json');

      writeFileSync(
        join(directory, 'darwin-aarch64.json'),
        JSON.stringify({
          platform: 'darwin-aarch64',
          release: {
            sha256: 'new-macos-checksum',
            signature: 'new-macos-signature',
            url: 'https://downloads.call3.dev/desktop/stable/0.1.1/macos',
          },
          version: '0.1.1',
        }),
      );
      writeFileSync(
        existingManifestFile,
        JSON.stringify({
          platforms: {
            'windows-x86_64': {
              sha256: 'old-windows-checksum',
              signature: 'old-windows-signature',
              url: 'https://downloads.call3.dev/desktop/stable/0.1.0/windows',
            },
          },
          version: '0.1.0',
        }),
      );

      createManifest({
        inputDirectory: directory,
        mergeManifestFile: existingManifestFile,
        outputFile,
        version: '0.1.1',
      });

      expect(JSON.parse(readFileSync(outputFile, 'utf8'))).toMatchObject({
        platforms: {
          'darwin-aarch64': {
            sha256: 'new-macos-checksum',
          },
        },
        version: '0.1.1',
      });
    });
  });
});
