export const API_BASE_URLS = {
  fetchx: resolveFetchxApiBaseUrl(
    import.meta.env.VITE_API_URL_FETCHX,
    import.meta.env.VITE_API_URL_CALL3,
  ),
  desktopDownloads: 'https://downloads.fetchx.dev',
  desktopUpdates: 'https://updates.fetchx.dev',
} as const;

export function buildApiUrl(baseUrl: string, path = '') {
  if (!path) return baseUrl;

  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

export function buildOptionalApiUrl(baseUrl: string | null, path = '') {
  return baseUrl ? buildApiUrl(baseUrl, path) : null;
}

export function buildFetchxApiUrl(path = '') {
  return buildOptionalApiUrl(API_BASE_URLS.fetchx, path);
}

export function buildDesktopDownloadsApiUrl(path = '') {
  return buildApiUrl(API_BASE_URLS.desktopDownloads, path);
}

export function buildDesktopUpdatesApiUrl(path = '') {
  return buildApiUrl(API_BASE_URLS.desktopUpdates, path);
}

export function isFetchxApiConfigured() {
  return API_BASE_URLS.fetchx !== null;
}

export function resolveFetchxApiBaseUrl(
  fetchxValue: unknown,
  legacyCall3Value: unknown,
) {
  return (
    normalizeOptionalBaseUrl(fetchxValue) ??
    normalizeOptionalBaseUrl(legacyCall3Value)
  );
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
