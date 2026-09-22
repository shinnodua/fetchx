import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';

import { getDesktopDownloadUrl } from '../desktopReleaseApi';

const validManifest = {
  version: '0.1.0',
  platforms: {
    'windows-x86_64': {
      url: 'https://downloads.fetchx.dev/desktop/stable/0.1.0/fetchx-0.1.0-windows-x86_64.exe',
      download_url:
        'https://downloads.fetchx.dev/desktop/stable/0.1.0/fetchx-0.1.0-windows-x86_64-setup.exe',
    },
    'darwin-aarch64': {
      url: 'https://downloads.fetchx.dev/desktop/stable/0.1.0/fetchx-0.1.0-darwin-aarch64.tar.gz',
      download_url:
        'https://downloads.fetchx.dev/desktop/stable/0.1.0/FetchX_0.1.0_aarch64.dmg',
    },
  },
};

const originalFetch = globalThis.fetch;
const fetchMock = mock(async (_url: RequestInfo | URL, _init?: RequestInit) =>
  createJsonResponse(validManifest),
);

describe('desktop release API', () => {
  beforeEach(() => {
    fetchMock.mockClear();
    globalThis.fetch = fetchMock;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test('returns direct stable desktop artifact URLs from channels/stable.json', async () => {
    await expect(getDesktopDownloadUrl('windows')).resolves.toBe(
      'https://downloads.fetchx.dev/desktop/stable/0.1.0/fetchx-0.1.0-windows-x86_64-setup.exe',
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://downloads.fetchx.dev/channels/stable.json',
      { headers: {}, method: 'GET' },
    );

    await expect(getDesktopDownloadUrl('mac')).resolves.toBe(
      'https://downloads.fetchx.dev/desktop/stable/0.1.0/FetchX_0.1.0_aarch64.dmg',
    );
  });

  test('rejects desktop artifact URLs from other origins', async () => {
    fetchMock.mockImplementationOnce(async () =>
      createJsonResponse({
        version: '0.1.0',
        platforms: {
          'windows-x86_64': {
            download_url:
              'https://example.com/desktop/stable/0.1.0/fetchx-0.1.0-windows-x86_64-setup.exe',
          },
        },
      }),
    );

    await expect(getDesktopDownloadUrl('windows')).rejects.toThrow(
      'Desktop release service returned an invalid download URL.',
    );
  });

  test('rejects legacy download route URLs', async () => {
    fetchMock.mockImplementationOnce(async () =>
      createJsonResponse({
        version: '0.1.0',
        platforms: {
          'windows-x86_64': {
            download_url:
              'https://downloads.fetchx.dev/v1/download/desktop/windows/x86_64/fetchx-0.1.0-windows-x86_64-setup.exe',
          },
        },
      }),
    );

    await expect(getDesktopDownloadUrl('windows')).rejects.toThrow(
      'Desktop release service returned an invalid download URL.',
    );
  });

  test('rejects when platform is missing from manifest', async () => {
    fetchMock.mockImplementationOnce(async () =>
      createJsonResponse({
        version: '0.1.0',
        platforms: {},
      }),
    );

    await expect(getDesktopDownloadUrl('windows')).rejects.toThrow(
      'Desktop release not found for windows-x86_64.',
    );
  });
});

function createJsonResponse(data: unknown) {
  return new Response(JSON.stringify(data), {
    headers: { 'content-type': 'application/json' },
    status: 200,
  });
}
