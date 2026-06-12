export const API_BASE_URLS = {
  call3: import.meta.env.VITE_API_URL_CALL3,
} as const;

export function buildApiUrl(baseUrl: string, path = '') {
  if (!path) return baseUrl;

  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}
