import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

interface ArtifactFragment {
  platform: string;
  release: { url: string };
  version: string;
}

interface PackageJson {
  version: string;
}

interface TauriConfig {
  version: string;
}

interface BuildTarget {
  bundles: string;
  platform: string;
  target: string;
}

const ROOT_DIRECTORY = resolve(import.meta.dir, '..');
const REQUIRED_PLATFORMS = [
  'darwin-aarch64',
  'darwin-x86_64',
  'windows-x86_64',
] as const;
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
    await run([
      'bun',
      'tauri',
      'build',
      '--target',
      target.target,
      '--bundles',
      target.bundles,
    ]);
    await run([
      'bun',
      'scripts/desktop-artifact.ts',
      'collect',
      '--platform',
      target.platform,
      '--target-dir',
      `src-tauri/target/${target.target}/release/bundle`,
      '--output-dir',
      artifactDirectory,
      '--base-url',
      DOWNLOAD_BASE_URL,
      '--version',
      version,
    ]);
  }

  console.log(
    `\nCollected ${process.platform} artifacts in ${artifactDirectory}`,
  );
  console.log(
    'Combine this directory with artifacts built on the other operating system before publishing.',
  );
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
  if (version !== tauriConfig.version || version !== cargoVersion) {
    throw new Error(
      'package.json, Cargo.toml, and tauri.conf.json versions must match.',
    );
  }
}

function validateReleaseArtifacts() {
  if (!existsSync(artifactDirectory)) {
    throw new Error(`Artifact directory does not exist: ${artifactDirectory}`);
  }

  for (const platform of REQUIRED_PLATFORMS) {
    const fragmentPath = join(artifactDirectory, `${platform}.json`);
    if (!existsSync(fragmentPath)) {
      throw new Error(`Missing release fragment: ${platform}.json`);
    }

    const fragment = readJson<ArtifactFragment>(fragmentPath);
    if (fragment.platform !== platform || fragment.version !== version) {
      throw new Error(`${platform}.json does not match version ${version}.`);
    }

    const updaterName = basename(new URL(fragment.release.url).pathname);
    if (
      !existsSync(join(artifactDirectory, updaterName)) ||
      !existsSync(join(artifactDirectory, `${updaterName}.sig`))
    ) {
      throw new Error(`Missing updater artifact or signature for ${platform}.`);
    }
  }

  const artifactNames = readdirSync(artifactDirectory);
  if (artifactNames.filter((name) => name.endsWith('.dmg')).length < 2) {
    throw new Error(
      'Both macOS DMG installers are required before publishing.',
    );
  }
  if (!artifactNames.some((name) => name.endsWith('-setup.exe'))) {
    throw new Error(
      'The Windows NSIS installer is required before publishing.',
    );
  }
}

function getBuildTargets(operatingSystem: NodeJS.Platform): BuildTarget[] {
  if (operatingSystem === 'darwin') {
    return [
      {
        target: 'aarch64-apple-darwin',
        platform: 'darwin-aarch64',
        bundles: 'app,dmg',
      },
      {
        target: 'x86_64-apple-darwin',
        platform: 'darwin-x86_64',
        bundles: 'app,dmg',
      },
    ];
  }
  if (operatingSystem === 'win32') {
    return [
      {
        target: 'x86_64-pc-windows-msvc',
        platform: 'windows-x86_64',
        bundles: 'nsis',
      },
    ];
  }
  throw new Error('Local desktop releases support macOS and Windows only.');
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
