export const API_BASE_URLS = {
  call3: normalizeOptionalBaseUrl(import.meta.env.VITE_API_URL_CALL3),
  desktopDownloads: 'https://downloads.call3.dev',
  desktopUpdates: 'https://updates.call3.dev',
} as const;

export function buildApiUrl(baseUrl: string, path = '') {
  if (!path) return baseUrl;

  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

export function buildOptionalApiUrl(baseUrl: string | null, path = '') {
  return baseUrl ? buildApiUrl(baseUrl, path) : null;
}

export function buildCall3ApiUrl(path = '') {
  return buildOptionalApiUrl(API_BASE_URLS.call3, path);
}

export function buildDesktopDownloadsApiUrl(path = '') {
  return buildApiUrl(API_BASE_URLS.desktopDownloads, path);
}

export function buildDesktopUpdatesApiUrl(path = '') {
  return buildApiUrl(API_BASE_URLS.desktopUpdates, path);
}

export function isCall3ApiConfigured() {
  return API_BASE_URLS.call3 !== null;
}

function normalizeOptionalBaseUrl(value: unknown) {
  if (typeof value !== 'string') return null;

  const trimmedValue = value.trim();
  const normalizedValue = trimmedValue.toLowerCase();
  if (
    trimmedValue === '' ||
    normalizedValue === 'null' ||
    normalizedValue === 'undefined'
  ) {
    return null;
  }

  return trimmedValue;
}
