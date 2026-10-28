import { apiRequest, buildUrlWithQueryParams } from './httpClient';

export interface RestCallResult {
  statusText: string;
  data: unknown;
  proxied: boolean;
}

function isJsonBody(body: string | undefined): boolean {
  if (!body?.trim()) return false;
  try {
    JSON.parse(body);
    return true;
  } catch {
    return false;
  }
}

export async function executeRestApiCall(
  type: string,
  target: string,
  headers: { key: string; value: string }[] | undefined,
  queryParams: { key: string; value: string }[] | undefined,
  body: string | undefined,
  bodyType: 'raw' | 'form-data' | 'x-www-form-urlencoded' | undefined,
  formData: { key: string; value: string }[] | undefined,
): Promise<RestCallResult> {
  const url = buildUrlWithQueryParams(target, queryParams);
  const headersObj: Record<string, string> = {};
  if (headers) {
    for (const h of headers) {
      if (h.key) headersObj[h.key] = h.value;
    }
  }

  let finalBody: BodyInit | undefined = body;
  const finalHeaders = { ...headersObj };
  const hasContentType = Object.keys(finalHeaders).some(
    (key) => key.toLowerCase() === 'content-type',
  );

  if (
    ['POST', 'PUT', 'PATCH'].includes(type.toUpperCase()) &&
    (bodyType === 'raw' || bodyType === undefined) &&
    !hasContentType &&
    body !== undefined
  ) {
    finalHeaders['content-type'] = isJsonBody(body)
      ? 'application/json'
      : 'text/plain;charset=UTF-8';
  }

  if (bodyType === 'x-www-form-urlencoded') {
    const params = new URLSearchParams();
    for (const item of formData ?? []) {
      if (item.key) params.append(item.key, item.value);
    }
    finalBody = params.toString();
    if (!hasContentType) {
      finalHeaders['content-type'] = 'application/x-www-form-urlencoded';
    }
  } else if (bodyType === 'form-data') {
    const form = new FormData();
    for (const item of formData ?? []) {
      if (item.key) form.append(item.key, item.value);
    }
    finalBody = form;
  }

  const response = await apiRequest(
    {
      url,
      method: type,
      headers: finalHeaders,
      body: finalBody,
    },
    { proxyOnBrowserBlock: true },
  );

  return {
    statusText: `${response.status} ${response.statusText}`,
    data: response.data,
    proxied: response.proxied,
  };
}
