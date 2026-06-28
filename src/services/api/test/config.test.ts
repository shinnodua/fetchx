import { describe, expect, test } from 'bun:test';

import {
  buildApiUrl,
  buildCall3ApiUrl,
  buildDesktopDownloadsApiUrl,
  buildOptionalApiUrl,
  isCall3ApiConfigured,
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
      'https://downloads.call3.dev/desktop/latest.json',
    );
    expect(buildCall3ApiUrl('/proxy')).toBe(
      isCall3ApiConfigured() ? buildCall3ApiUrl('/proxy') : null,
    );
  });
});
