import { describe, expect, test } from 'bun:test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  resolveDesktopVersion,
  updateDesktopVersion,
} from '../desktop-version.ts';

function withTempDirectory(callback: (directory: string) => void) {
  const directory = mkdtempSync(join(tmpdir(), 'fetchx-version-test-'));
  try {
    callback(directory);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function writeVersionFiles(directory: string) {
  const packageJson = join(directory, 'package.json');
  const tauriConfig = join(directory, 'tauri.conf.json');
  const cargoToml = join(directory, 'Cargo.toml');
  const cargoLock = join(directory, 'Cargo.lock');

  writeFileSync(packageJson, '{\n  "version": "0.1.1"\n}\n');
  writeFileSync(tauriConfig, '{\n  "version": "0.1.1"\n}\n');
  writeFileSync(cargoToml, '[package]\nname = "FetchX"\nversion = "0.1.1"\n');
  writeFileSync(cargoLock, '[[package]]\nname = "FetchX"\nversion = "0.1.1"\n');

  return { cargoLock, cargoToml, packageJson, tauriConfig };
}

describe('desktop version command', () => {
  test('resolves major, minor, patch, and explicit release versions', () => {
    expect(resolveDesktopVersion('1.2.3', 'major')).toBe('2.0.0');
    expect(resolveDesktopVersion('1.2.3', 'minor')).toBe('1.3.0');
    expect(resolveDesktopVersion('1.2.3', 'patch')).toBe('1.2.4');
    expect(resolveDesktopVersion('1.2.3', '4.5.6')).toBe('4.5.6');
  });

  test('rejects non-stable SemVer release versions', () => {
    expect(() => resolveDesktopVersion('1.2', 'patch')).toThrow(
      'Current version must be a stable SemVer value such as 1.2.3.',
    );
    expect(() => resolveDesktopVersion('1.2.3', '1.2.3-rc.1')).toThrow(
      'Release version must be a stable SemVer value such as 1.2.3.',
    );
  });

  test('updates every desktop release version source', () => {
    withTempDirectory((directory) => {
      const files = writeVersionFiles(directory);

      updateDesktopVersion('1.2.3', files);

      for (const file of Object.values(files)) {
        expect(readFileSync(file, 'utf8')).toContain('1.2.3');
        expect(readFileSync(file, 'utf8')).not.toContain('0.1.1');
      }
    });
  });

  test('uses the FetchX desktop application identifier', () => {
    const config = JSON.parse(
      readFileSync(
        resolve(import.meta.dir, '../../src-tauri/tauri.conf.json'),
        'utf8',
      ),
    ) as { identifier: string };

    expect(config.identifier).toBe('dev.fetchx.desktop');
  });
});
