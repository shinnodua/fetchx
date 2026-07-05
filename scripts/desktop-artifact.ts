import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';
import { sha256File } from './desktop-release-security.ts';

interface PlatformRelease {
  sha256: string;
  signature: string;
  url: string;
  download_url?: string;
}

interface ArtifactFragment {
  platform: string;
  release: PlatformRelease;
  version: string;
}

interface ReleaseManifest {
  version: string;
  notes?: string;
  pub_date?: string;
  platforms: Record<string, PlatformRelease>;
}

const getArgument = (name: string) => {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
};

const requiredArgument = (name: string) => {
  const value = getArgument(name);
  if (!value) throw new Error(`Missing --${name}.`);
  return value;
};

function walkFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(path) : [path];
  });
}

function updaterArtifact(files: string[], platform: string) {
  if (platform.startsWith('darwin-')) {
    return files.find((file) => file.endsWith('.app.tar.gz'));
  }
  if (platform.startsWith('windows-')) {
    return files.find(
      (file) => file.endsWith('-setup.exe') && existsSync(`${file}.sig`),
    );
  }
  return undefined;
}

function collectArtifact() {
  const platform = requiredArgument('platform');
  const targetDirectory = resolve(requiredArgument('target-dir'));
  const outputDirectory = resolve(requiredArgument('output-dir'));
  const baseUrl = requiredArgument('base-url').replace(/\/$/, '');
  const version = requiredArgument('version');
  const files = walkFiles(targetDirectory);
  const updateFile = updaterArtifact(files, platform);
  if (!updateFile || !existsSync(`${updateFile}.sig`)) {
    throw new Error(`No signed updater artifact found for ${platform}.`);
  }

  mkdirSync(outputDirectory, { recursive: true });
  const suffix = platform.startsWith('darwin-')
    ? '.tar.gz'
    : extname(updateFile);
  const artifactName = `call3-${version}-${platform}${suffix}`;
  cpSync(updateFile, join(outputDirectory, artifactName));
  cpSync(`${updateFile}.sig`, join(outputDirectory, `${artifactName}.sig`));

  const installers = files.filter(
    (file) => file.endsWith('.dmg') || file.endsWith('-setup.exe'),
  );
  let downloadUrl: string | undefined;
  for (const installer of installers) {
    if (installer === updateFile) {
      if (!downloadUrl)
        downloadUrl = `${baseUrl}/desktop/stable/${version}/${artifactName}`;
      continue;
    }
    const installerName = basename(installer);
    cpSync(installer, join(outputDirectory, installerName));
    downloadUrl = `${baseUrl}/desktop/stable/${version}/${installerName}`;
  }

  const fragment: ArtifactFragment = {
    platform,
    version,
    release: {
      sha256: sha256File(updateFile),
      signature: readFileSync(`${updateFile}.sig`, 'utf8').trim(),
      url: `${baseUrl}/desktop/stable/${version}/${artifactName}`,
      download_url: downloadUrl,
    },
  };
  writeFileSync(
    join(outputDirectory, `${platform}.json`),
    `${JSON.stringify(fragment, null, 2)}\n`,
  );
}

function createManifest() {
  const inputDirectory = resolve(requiredArgument('input-dir'));
  const outputFile = resolve(requiredArgument('output'));
  const version = requiredArgument('version');
  const notes = getArgument('notes') ?? `Call3 ${version}`;
  const mergeManifestFile = getArgument('merge-manifest');
  const fragments = walkFiles(inputDirectory)
    .filter(
      (file) => file.endsWith('.json') && basename(file) !== 'stable.json',
    )
    .map((file) => JSON.parse(readFileSync(file, 'utf8')) as ArtifactFragment);

  if (fragments.length === 0) throw new Error('No artifact fragments found.');
  if (fragments.some((fragment) => fragment.version !== version)) {
    throw new Error('Artifact versions do not match the release version.');
  }

  const platforms = Object.fromEntries(
    fragments.map((fragment) => [fragment.platform, fragment.release]),
  );

  let mergedPlatforms = { ...platforms };
  if (mergeManifestFile && existsSync(resolve(mergeManifestFile))) {
    try {
      const oldManifest = JSON.parse(
        readFileSync(resolve(mergeManifestFile), 'utf8'),
      ) as ReleaseManifest;
      if (oldManifest.version === version && oldManifest.platforms) {
        mergedPlatforms = { ...oldManifest.platforms, ...mergedPlatforms };
      }
    } catch (e) {
      console.warn(`Failed to merge manifest: ${e}`);
    }
  }

  writeFileSync(
    outputFile,
    `${JSON.stringify(
      {
        version,
        notes,
        pub_date: new Date().toISOString(),
        platforms: mergedPlatforms,
      },
      null,
      2,
    )}\n`,
  );
}

const command = process.argv[2];
if (command === 'collect') collectArtifact();
else if (command === 'manifest') createManifest();
else throw new Error('Expected the collect or manifest command.');
