import { API_BASE_URLS, buildDesktopDownloadsApiUrl } from './config';
import { getApiErrorMessage } from './errors';
import { apiRequest } from './httpClient';

export type DesktopDownloadPlatform = 'mac' | 'windows';

interface PlatformRelease {
  sha256?: unknown;
  signature?: unknown;
  url?: unknown;
  download_url?: unknown;
}

interface DesktopReleaseManifest {
  version?: unknown;
  notes?: unknown;
  pub_date?: unknown;
  platforms?: Record<string, PlatformRelease>;
}

interface NavigatorUserAgentData {
  getHighEntropyValues: (hints: string[]) => Promise<{ architecture?: string }>;
}

const DOWNLOAD_TARGETS = {
  windows: { target: 'windows', arch: 'x86_64' },
} as const;
const DESKTOP_RELEASE_ARTIFACT_PATH = /^\/desktop\/stable\/[^/]+\/[^/]+$/;

export async function getDesktopDownloadUrl(
  platform: DesktopDownloadPlatform,
): Promise<string> {
  const target = await getDownloadTarget(platform);
  const manifestUrl = buildDesktopDownloadsApiUrl('channels/stable.json');

  const response = await apiRequest(
    { url: manifestUrl, method: 'GET' },
    { proxyOnBrowserBlock: true },
  );
  if (response.status < 200 || response.status >= 300) {
    throw new Error(
      getApiErrorMessage(response.data) ||
        `Desktop release lookup failed with status ${response.status}.`,
    );
  }

  const manifest = response.data as DesktopReleaseManifest;
  if (
    typeof manifest !== 'object' ||
    manifest === null ||
    typeof manifest.platforms !== 'object' ||
    manifest.platforms === null
  ) {
    throw new Error('Desktop release service returned an invalid response.');
  }

  const platformKey = `${target.target}-${target.arch}`;
  const platformEntry =
    manifest.platforms[platformKey] ??
    (target.target === 'darwin'
      ? manifest.platforms['darwin-aarch64']
      : undefined);

  if (!platformEntry || typeof platformEntry !== 'object') {
    throw new Error(`Desktop release not found for ${platformKey}.`);
  }

  const targetUrl =
    typeof platformEntry.download_url === 'string'
      ? platformEntry.download_url
      : platformEntry.url;

  if (typeof targetUrl !== 'string') {
    throw new Error('Desktop release service returned an invalid response.');
  }

  const downloadUrl = new URL(targetUrl);
  const serviceOrigin = new URL(API_BASE_URLS.desktopDownloads).origin;
  if (
    downloadUrl.origin !== serviceOrigin ||
    !DESKTOP_RELEASE_ARTIFACT_PATH.test(downloadUrl.pathname)
  ) {
    throw new Error(
      'Desktop release service returned an invalid download URL.',
    );
  }

  return downloadUrl.toString();
}

async function getDownloadTarget(platform: DesktopDownloadPlatform) {
  if (platform === 'windows') return DOWNLOAD_TARGETS.windows;

  const navigatorWithUserAgentData = navigator as Navigator & {
    userAgentData?: NavigatorUserAgentData;
  };
  try {
    const values =
      await navigatorWithUserAgentData.userAgentData?.getHighEntropyValues([
        'architecture',
      ]);
    if (values?.architecture?.toLowerCase().includes('x86')) {
      return { target: 'darwin', arch: 'x86_64' } as const;
    }
  } catch {
    // Browsers may withhold high-entropy architecture data.
  }

  return { target: 'darwin', arch: 'aarch64' } as const;
}
