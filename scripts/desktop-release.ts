import { readFileSync } from 'node:fs';

interface PackageJson {
  version: string;
}

interface TauriConfig {
  plugins?: { updater?: { pubkey?: string } };
  version: string;
}

const packageJson = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
) as PackageJson;
const tauriConfig = JSON.parse(
  readFileSync(
    new URL('../src-tauri/tauri.conf.json', import.meta.url),
    'utf8',
  ),
) as TauriConfig;
const cargoToml = readFileSync(
  new URL('../src-tauri/Cargo.toml', import.meta.url),
  'utf8',
);
const cargoVersion = /^version = "([^"]+)"$/m.exec(cargoToml)?.[1];

if (
  packageJson.version !== tauriConfig.version ||
  packageJson.version !== cargoVersion
) {
  throw new Error(
    'package.json, Cargo.toml, and tauri.conf.json versions must match.',
  );
}
if (tauriConfig.plugins?.updater?.pubkey?.startsWith('REPLACE_WITH_')) {
  throw new Error(
    'Generate the Tauri updater key and replace the placeholder public key before releasing.',
  );
}
if (!process.env.TAURI_SIGNING_PRIVATE_KEY) {
  throw new Error('TAURI_SIGNING_PRIVATE_KEY is required for a release build.');
}

const child = Bun.spawn(['bun', 'tauri', 'build'], {
  cwd: new URL('..', import.meta.url).pathname,
  env: process.env,
  stderr: 'inherit',
  stdout: 'inherit',
});
const exitCode = await child.exited;
process.exit(exitCode);
