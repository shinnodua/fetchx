import { readFileSync } from 'node:fs';
import {
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

validateVersionAlignment({
  cargoVersion,
  packageVersion: packageJson.version,
  tauriVersion: tauriConfig.version,
});
validateUpdaterPublicKey(tauriConfig.plugins?.updater?.pubkey);
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
