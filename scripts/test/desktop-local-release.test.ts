import { describe, expect, test } from 'bun:test';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  discardIncompleteManifest,
  releaseFilesForFragments,
} from '../desktop-local-release.ts';

function withTempDirectory(callback: (directory: string) => void) {
  const directory = mkdtempSync(join(tmpdir(), 'fetchx-local-release-test-'));
  try {
    callback(directory);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

describe('desktop local release publishing', () => {
  test('uploads only FetchX files referenced by validated release fragments', () => {
    withTempDirectory((directory) => {
      const updater = 'fetchx-0.1.2-darwin-aarch64.tar.gz';
      const installer = 'FetchX_0.1.2_aarch64.dmg';
      writeFileSync(join(directory, updater), 'updater');
      writeFileSync(join(directory, `${updater}.sig`), 'signature');
      writeFileSync(join(directory, installer), 'installer');
      writeFileSync(
        join(directory, 'call3-0.1.1-darwin-aarch64.tar.gz'),
        'stale',
      );

      expect(
        releaseFilesForFragments(
          [
            {
              platform: 'darwin-aarch64',
              release: {
                download_url: `https://downloads.fetchx.dev/desktop/stable/0.1.2/${installer}`,
                sha256: 'checksum',
                signature: 'signature',
                url: `https://downloads.fetchx.dev/desktop/stable/0.1.2/${updater}`,
              },
              version: '0.1.2',
            },
          ],
          directory,
        ),
      ).toEqual([
        join(directory, updater),
        join(directory, `${updater}.sig`),
        join(directory, installer),
      ]);
    });
  });

  test('removes a partial manifest after a failed R2 download', () => {
    withTempDirectory((directory) => {
      const manifest = join(directory, 'existing-stable.json');
      writeFileSync(manifest, '');

      discardIncompleteManifest(manifest);

      expect(existsSync(manifest)).toBe(false);
    });
  });
});
