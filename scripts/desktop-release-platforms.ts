const WINDOW = 'windows-x86_64';
const MACOS = 'darwin-aarch64';

export const REQUIRED_PLATFORMS = [MACOS, WINDOW] as const;

export type ReleasePlatform = (typeof REQUIRED_PLATFORMS)[number];

export interface BuildTarget {
  bundles: string;
  platform: ReleasePlatform;
  target: string;
}

export function getBuildTargets(
  operatingSystem: NodeJS.Platform,
): BuildTarget[] {
  if (operatingSystem === 'darwin') {
    return [
      {
        target: 'aarch64-apple-darwin',
        platform: 'darwin-aarch64',
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

export function isReleasePlatform(value: string): value is ReleasePlatform {
  return REQUIRED_PLATFORMS.some((platform) => platform === value);
}
