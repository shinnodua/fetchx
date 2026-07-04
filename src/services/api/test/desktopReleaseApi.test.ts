import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';

import { getDesktopDownloadUrl } from '../desktopReleaseApi';

const originalFetch = globalThis.fetch;
const fetchMock = mock(async (_url: RequestInfo | URL, _init?: RequestInit) =>
  createJsonResponse({
    url: 'https://downloads.call3.dev/desktop/stable/0.1.0/call3-0.1.0-windows-x86_64-setup.exe',
  }),
);

describe('desktop release API', () => {
  beforeEach(() => {
    fetchMock.mockClear();
    globalThis.fetch = fetchMock;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test('returns direct stable desktop artifact URLs from the download host', async () => {
    await expect(getDesktopDownloadUrl('windows')).resolves.toBe(
      'https://downloads.call3.dev/desktop/stable/0.1.0/call3-0.1.0-windows-x86_64-setup.exe',
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://updates.call3.dev/v1/update/windows/x86_64/0.0.0',
      { headers: {}, method: 'GET' },
    );
  });

  test('rejects desktop artifact URLs from other origins', async () => {
    fetchMock.mockImplementationOnce(async () =>
      createJsonResponse({
        url: 'https://example.com/desktop/stable/0.1.0/call3-0.1.0-windows-x86_64-setup.exe',
      }),
    );

    await expect(getDesktopDownloadUrl('windows')).rejects.toThrow(
      'Desktop release service returned an invalid download URL.',
    );
  });

  test('rejects legacy download route URLs', async () => {
    fetchMock.mockImplementationOnce(async () =>
      createJsonResponse({
        url: 'https://downloads.call3.dev/v1/download/desktop/windows/x86_64/call3-0.1.0-windows-x86_64-setup.exe',
      }),
    );

    await expect(getDesktopDownloadUrl('windows')).rejects.toThrow(
      'Desktop release service returned an invalid download URL.',
    );
  });
});

function createJsonResponse(data: unknown) {
  return new Response(JSON.stringify(data), {
    headers: { 'content-type': 'application/json' },
    status: 200,
  });
}
