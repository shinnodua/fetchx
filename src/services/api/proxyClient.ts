import { buildFetchxApiUrl } from './config';
import { getApiErrorMessage } from './errors';
import type { ApiRequest, ApiResponse, ProxyResponseBody } from './types';

export async function callCorsProxy(request: ApiRequest): Promise<ApiResponse> {
  const proxyUrl = buildFetchxApiUrl('/proxy');
  if (!proxyUrl) {
    throw new Error('Fetchx API URL is not configured.');
  }

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

  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(proxyBody),
  });

  const responseText = await response.text();
  let proxyData: unknown;
  try {
    proxyData = responseText ? JSON.parse(responseText) : null;
  } catch {
    throw new Error(
      `Proxy request failed with status ${response.status}: invalid response.`,
    );
  }

  if (!response.ok) {
    throw new Error(getProxyErrorMessage(proxyData, response.status));
  }

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

function getProxyErrorMessage(value: unknown, status: number): string {
  const apiErrorMessage = getApiErrorMessage(value);
  if (apiErrorMessage) {
    return `Proxy request failed: ${apiErrorMessage}`;
  }

  if (typeof value === 'object' && value !== null && 'error' in value) {
    const error = value.error;
    if (typeof error === 'string' && error.trim()) {
      return `Proxy request failed: ${error}`;
    }
  }

  return `Proxy request failed with status ${status}.`;
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
