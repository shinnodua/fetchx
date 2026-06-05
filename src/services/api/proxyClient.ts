import { API_BASE_URLS, buildApiUrl } from './config';
import type { ApiRequest, ApiResponse, ProxyResponseBody } from './types';

const CORS_PROXY_URL = buildApiUrl(API_BASE_URLS.call3, '/proxy');

export async function callCorsProxy(request: ApiRequest): Promise<ApiResponse> {
  const proxyBody: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: ApiRequest['body'];
  } = {
    url: request.url,
    method: request.method ?? 'GET',
    headers: request.headers ?? {},
  };

  if (request.method !== 'GET' && request.body !== undefined) {
    proxyBody.body = request.body;
  }

  const response = await fetch(CORS_PROXY_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(proxyBody),
  });

  const proxyData = (await response.json()) as unknown;
  if (!isProxyResponseBody(proxyData)) {
    throw new Error('Proxy returned an invalid response.');
  }

  return {
    status: proxyData.status,
    statusText: proxyData.statusText,
    headers: proxyData.headers,
    data: proxyData.body,
    proxied: true,
  };
}

function isProxyResponseBody(value: unknown): value is ProxyResponseBody {
  if (typeof value !== 'object' || value === null) return false;

  const response = value as Partial<ProxyResponseBody>;
  return (
    typeof response.status === 'number' &&
    typeof response.statusText === 'string' &&
    typeof response.headers === 'object' &&
    response.headers !== null &&
    'body' in response &&
    (response.bodyType === 'json' ||
      response.bodyType === 'text' ||
      response.bodyType === 'empty')
  );
}
