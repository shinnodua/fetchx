import { API_BASE_URLS, buildDesktopUpdatesApiUrl } from './config';
import { getApiErrorMessage } from './errors';
import { apiRequest } from './httpClient';

export type DesktopDownloadPlatform = 'mac' | 'windows';

interface DesktopUpdateResponse {
  url?: unknown;
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
  const updateUrl = buildDesktopUpdatesApiUrl(
    `v1/update/${target.target}/${target.arch}/0.0.0`,
  );

  const response = await apiRequest({ url: updateUrl, method: 'GET' });
  if (response.status < 200 || response.status >= 300) {
    throw new Error(
      getApiErrorMessage(response.data) ||
        `Desktop release lookup failed with status ${response.status}.`,
    );
  }

  const data = response.data as DesktopUpdateResponse;
  if (
    typeof data !== 'object' ||
    data === null ||
    typeof data.url !== 'string'
  ) {
    throw new Error('Desktop release service returned an invalid response.');
  }

  const downloadUrl = new URL(data.url);
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
