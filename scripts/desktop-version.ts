import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

type VersionBump = 'major' | 'minor' | 'patch';

const STABLE_SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

interface PackageJson {
  version: string;
}

export interface DesktopVersionFiles {
  cargoLock: string;
  cargoToml: string;
  packageJson: string;
  tauriConfig: string;
}

export function resolveDesktopVersion(
  version: string,
  request: string,
): string {
  const current = parseStableSemver(version, 'Current version');

  if (isVersionBump(request)) {
    if (request === 'major') return `${current.major + 1}.0.0`;
    if (request === 'minor') return `${current.major}.${current.minor + 1}.0`;
    return `${current.major}.${current.minor}.${current.patch + 1}`;
  }

  parseStableSemver(request, 'Release version');
  return request;
}

export function updateDesktopVersion(
  version: string,
  files: DesktopVersionFiles,
) {
  parseStableSemver(version, 'Release version');

  const packageJson = JSON.parse(
    readFileSync(files.packageJson, 'utf8'),
  ) as PackageJson;
  packageJson.version = version;

  writeFileSync(files.packageJson, `${JSON.stringify(packageJson, null, 2)}\n`);
  replaceFileVersion(files.tauriConfig, version, 'Tauri config');
  replaceWindowTitle(files.tauriConfig, version);
  replacePackageVersion(files.cargoToml, version, 'Cargo.toml');
  replacePackageVersion(files.cargoLock, version, 'Cargo.lock');
}

function getDesktopVersionFiles(rootDirectory: string): DesktopVersionFiles {
  return {
    cargoLock: join(rootDirectory, 'src-tauri/Cargo.lock'),
    cargoToml: join(rootDirectory, 'src-tauri/Cargo.toml'),
    packageJson: join(rootDirectory, 'package.json'),
    tauriConfig: join(rootDirectory, 'src-tauri/tauri.conf.json'),
  };
}

function parseStableSemver(version: string, label: string) {
  const match = STABLE_SEMVER_PATTERN.exec(version);
  if (!match) {
    throw new Error(`${label} must be a stable SemVer value such as 1.2.3.`);
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function isVersionBump(request: string): request is VersionBump {
  return request === 'major' || request === 'minor' || request === 'patch';
}

function replaceFileVersion(file: string, version: string, label: string) {
  const content = readFileSync(file, 'utf8');
  const updatedContent = content.replace(
    /("version"\s*:\s*)"[^"]+"/,
    `$1"${version}"`,
  );

  if (content === updatedContent) {
    throw new Error(`${label} does not contain a version field.`);
  }

  writeFileSync(file, updatedContent);
}

function replacePackageVersion(file: string, version: string, label: string) {
  const content = readFileSync(file, 'utf8');
  const updatedContent = content.replace(
    /(\[\[?package\]\]?\nname = "FetchX"\nversion = )"[^"]+"/,
    `$1"${version}"`,
  );

  if (content === updatedContent) {
    throw new Error(`${label} does not contain the FetchX package version.`);
  }

  writeFileSync(file, updatedContent);
}

function replaceWindowTitle(file: string, version: string) {
  const content = readFileSync(file, 'utf8');
  const updatedContent = content.replace(
    /("title"\s*:\s*)"FetchX(?: v[^"]+)?"/,
    `$1"FetchX v${version}"`,
  );

  if (content === updatedContent) {
    throw new Error(`${file} does not contain the FetchX window title.`);
  }

  writeFileSync(file, updatedContent);
}

function printHelp() {
  console.log(`Fetchx desktop version

Usage:
  bun run desktop:version <patch|minor|major|x.y.z>

Examples:
  bun run desktop:version patch
  bun run desktop:version 1.2.3`);
}

if (import.meta.main) {
  const request = process.argv[2];
  if (request === 'help' || request === '--help') {
    printHelp();
  } else if (!request) {
    throw new Error('Missing version. Example: bun run desktop:version patch');
  } else {
    const rootDirectory = resolve(import.meta.dir, '..');
    const files = getDesktopVersionFiles(rootDirectory);
    const packageJson = JSON.parse(
      readFileSync(files.packageJson, 'utf8'),
    ) as PackageJson;
    const version = resolveDesktopVersion(packageJson.version, request);

    updateDesktopVersion(version, files);
    console.log(`Updated desktop release version to ${version}.`);
  }
}
