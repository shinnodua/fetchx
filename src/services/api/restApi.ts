import { apiRequest, buildUrlWithQueryParams } from './httpClient';

export interface RestCallResult {
  statusText: string;
  data: unknown;
  proxied: boolean;
}

export async function executeRestApiCall(
  type: string,
  target: string,
  headers: { key: string; value: string }[] | undefined,
  queryParams: { key: string; value: string }[] | undefined,
  body: string | undefined,
): Promise<RestCallResult> {
  const url = buildUrlWithQueryParams(target, queryParams);
  const headersObj: Record<string, string> = {};
  if (headers) {
    for (const h of headers) {
      if (h.key) headersObj[h.key] = h.value;
    }
  }

  const response = await apiRequest(
    {
      url,
      method: type,
      headers: headersObj,
      body,
    },
    { proxyOnBrowserBlock: true },
  );

  return {
    statusText: `${response.status} ${response.statusText}`,
    data: response.data,
    proxied: response.proxied,
  };
}
