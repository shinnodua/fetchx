import { describe, expect, test } from 'bun:test';

import {
  buildApiUrl,
  buildDesktopDownloadsApiUrl,
  buildFetchxApiUrl,
  buildOptionalApiUrl,
  isFetchxApiConfigured,
  resolveFetchxApiBaseUrl,
} from '../config';

describe('API config utilities', () => {
  test('builds URLs without duplicate slashes', () => {
    expect(buildApiUrl('https://api.example.com/', '/proxy')).toBe(
      'https://api.example.com/proxy',
    );
    expect(buildApiUrl('https://api.example.com', '')).toBe(
      'https://api.example.com',
    );
  });

  test('handles optional API base URLs', () => {
    expect(buildOptionalApiUrl(null, '/proxy')).toBeNull();
    expect(buildOptionalApiUrl('https://api.example.com', '/proxy')).toBe(
      'https://api.example.com/proxy',
    );
  });

  test('builds named service URLs', () => {
    expect(buildDesktopDownloadsApiUrl('/desktop/latest.json')).toBe(
      'https://downloads.fetchx.dev/desktop/latest.json',
    );
    expect(buildFetchxApiUrl('/proxy')).toBe(
      isFetchxApiConfigured() ? buildFetchxApiUrl('/proxy') : null,
    );
  });

  test('prefers the Fetchx API setting and supports the Call3 migration setting', () => {
    expect(
      resolveFetchxApiBaseUrl(
        'https://api.fetchx.dev',
        'https://api.call3.dev',
      ),
    ).toBe('https://api.fetchx.dev');
    expect(resolveFetchxApiBaseUrl('', 'https://api.call3.dev')).toBe(
      'https://api.call3.dev',
    );
    expect(resolveFetchxApiBaseUrl('', '')).toBeNull();
  });
});
