import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import {
  type BuildTarget,
  getBuildTargets,
  isReleasePlatform,
  REQUIRED_PLATFORMS,
  type ReleasePlatform,
} from './desktop-release-platforms.ts';
import {
  type UpdaterArtifactFragment,
  validateUpdaterFragment,
  validateUpdaterPublicKey,
  validateVersionAlignment,
} from './desktop-release-security.ts';

interface PackageJson {
  version: string;
}

interface TauriConfig {
  plugins?: { updater?: { pubkey?: string } };
  version: string;
}

const ROOT_DIRECTORY = resolve(import.meta.dir, '..');
const DOWNLOAD_BASE_URL = 'https://downloads.call3.dev';
const DEFAULT_BUCKET = 'call3-desktop-releases';

const action = process.argv[2];
const packageJson = readJson<PackageJson>(join(ROOT_DIRECTORY, 'package.json'));
const tauriConfig = readJson<TauriConfig>(
  join(ROOT_DIRECTORY, 'src-tauri/tauri.conf.json'),
);
const cargoToml = readFileSync(
  join(ROOT_DIRECTORY, 'src-tauri/Cargo.toml'),
  'utf8',
);
const cargoVersion = /^version = "([^"]+)"$/m.exec(cargoToml)?.[1];
const version = packageJson.version;
const artifactDirectory = resolve(
  ROOT_DIRECTORY,
  getArgument('artifact-dir') ?? 'desktop-artifacts',
);

validateVersions();

if (action === 'help' || action === '--help') printHelp();
else if (action === 'build') await buildForCurrentOperatingSystem();
else if (action === 'build-macos') await buildForOperatingSystem('darwin');
else if (action === 'build-windows') await buildForOperatingSystem('win32');
else if (action === 'publish') await publishRelease();
else {
  throw new Error(
    'Expected build or publish. Example: bun run desktop:local:build',
  );
}

function printHelp() {
  console.log(`Call3 local desktop release

Commands:
  bun run desktop:local:build [--artifact-dir <path>]
  bun run desktop:local:build:macos [--artifact-dir <path>]
  bun run desktop:local:build:windows [--artifact-dir <path>]
  bun run desktop:local:publish [--artifact-dir <path>] [--notes <text>]

Build on macOS and Windows, combine the generated artifacts, then publish.`);
}

async function buildForCurrentOperatingSystem() {
  await buildForOperatingSystem(process.platform);
}

async function buildForOperatingSystem(operatingSystem: NodeJS.Platform) {
  if (process.platform !== operatingSystem) {
    throw new Error(
      `${formatOperatingSystem(operatingSystem)} artifacts must be built on ${formatOperatingSystem(operatingSystem)}.`,
    );
  }

  requireEnvironmentVariable('TAURI_SIGNING_PRIVATE_KEY');
  const targets = getBuildTargets(operatingSystem);

  await run(['bun', 'run', 'lint']);
  for (const target of targets) {
    await run(['rustup', 'target', 'add', target.target]);
    await run(tauriBuildCommand(target, operatingSystem));
    await collectTargetArtifacts(target);
  }

  console.log(
    `\nCollected ${process.platform} artifacts in ${artifactDirectory}`,
  );
  console.log(
    'Combine this directory with artifacts built on the other operating system before publishing.',
  );
}

function tauriBuildCommand(
  target: BuildTarget,
  operatingSystem: NodeJS.Platform,
) {
  const command = [
    'bun',
    'tauri',
    'build',
    '--target',
    target.target,
    '--bundles',
    target.bundles,
  ];

  if (operatingSystem === 'darwin') {
    command.push('--skip-stapling');
  }

  return command;
}

async function collectTargetArtifacts(target: BuildTarget) {
  const targetBundleDirectory = `src-tauri/target/${target.target}/release/bundle`;

  await run([
    'bun',
    'scripts/desktop-artifact.ts',
    'collect',
    '--platform',
    target.platform,
    '--target-dir',
    targetBundleDirectory,
    '--output-dir',
    artifactDirectory,
    '--base-url',
    DOWNLOAD_BASE_URL,
    '--version',
    version,
  ]);
}

async function publishRelease() {
  requireEnvironmentVariable('CLOUDFLARE_ACCOUNT_ID');
  requireEnvironmentVariable('CLOUDFLARE_API_TOKEN');
  validateReleaseArtifacts();

  const manifestPath = join(artifactDirectory, 'stable.json');
  await run([
    'bun',
    'scripts/desktop-artifact.ts',
    'manifest',
    '--input-dir',
    artifactDirectory,
    '--output',
    manifestPath,
    '--version',
    version,
    '--notes',
    getArgument('notes') ?? `Call3 ${version}`,
  ]);

  const bucket = process.env.R2_BUCKET ?? DEFAULT_BUCKET;
  const releaseFiles = readdirSync(artifactDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && !entry.name.endsWith('.json'))
    .map((entry) => join(artifactDirectory, entry.name));

  for (const file of releaseFiles) {
    await run([
      'bun',
      'wrangler',
      'r2',
      'object',
      'put',
      `${bucket}/desktop/stable/${version}/${basename(file)}`,
      '--file',
      file,
      '--remote',
    ]);
  }

  await run([
    'bun',
    'wrangler',
    'r2',
    'object',
    'put',
    `${bucket}/channels/stable.json`,
    '--file',
    manifestPath,
    '--remote',
  ]);
  console.log(`\nPublished Call3 ${version} to ${bucket}.`);
}

function validateVersions() {
  validateVersionAlignment({
    cargoVersion,
    packageVersion: version,
    tauriVersion: tauriConfig.version,
  });
  validateUpdaterPublicKey(tauriConfig.plugins?.updater?.pubkey);
}

function validateReleaseArtifacts() {
  if (!existsSync(artifactDirectory)) {
    throw new Error(`Artifact directory does not exist: ${artifactDirectory}`);
  }

  const platforms = releasePlatformsInArtifactDirectory();
  if (platforms.length === 0) {
    throw new Error(
      `At least one release fragment is required: ${REQUIRED_PLATFORMS.map((platform) => `${platform}.json`).join(', ')}`,
    );
  }

  for (const platform of platforms) {
    const fragmentPath = join(artifactDirectory, `${platform}.json`);
    const fragment = readJson<UpdaterArtifactFragment>(fragmentPath);
    validateUpdaterFragment(fragment, {
      artifactDirectory,
      expectedPlatform: platform,
      expectedVersion: version,
    });
  }

  const artifactNames = readdirSync(artifactDirectory);
  if (
    platforms.includes('darwin-aarch64') &&
    !artifactNames.some((name) => name.endsWith('.dmg'))
  ) {
    throw new Error(
      'The Apple Silicon macOS DMG installer is required before publishing.',
    );
  }
  if (
    platforms.includes('windows-x86_64') &&
    !artifactNames.some((name) => name.endsWith('-setup.exe'))
  ) {
    throw new Error(
      'The Windows NSIS installer is required before publishing.',
    );
  }
}

function releasePlatformsInArtifactDirectory(): ReleasePlatform[] {
  return readdirSync(artifactDirectory)
    .filter((name) => name.endsWith('.json') && name !== 'stable.json')
    .map((name) => name.replace(/\.json$/, ''))
    .filter(isReleasePlatform);
}

function formatOperatingSystem(operatingSystem: NodeJS.Platform) {
  if (operatingSystem === 'darwin') return 'macOS';
  if (operatingSystem === 'win32') return 'Windows';
  return operatingSystem;
}

function getArgument(name: string) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

function requireEnvironmentVariable(name: string) {
  if (!process.env[name]) throw new Error(`${name} is required.`);
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

async function run(command: string[]) {
  console.log(`\n> ${command.join(' ')}`);
  const child = Bun.spawn(command, {
    cwd: ROOT_DIRECTORY,
    env: process.env,
    stderr: 'inherit',
    stdout: 'inherit',
  });
  const exitCode = await child.exited;
  if (exitCode !== 0) {
    throw new Error(`Command failed with exit code ${exitCode}.`);
  }
}
