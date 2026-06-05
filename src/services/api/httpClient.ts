import { callCorsProxy } from './proxyClient';
import type { ApiRequest, ApiResponse } from './types';

export interface ApiClientOptions {
  proxyOnBrowserBlock?: boolean;
}

interface NormalizedApiRequest extends ApiRequest {
  method: string;
  headers: Record<string, string>;
}

export async function apiRequest(
  request: ApiRequest,
  options: ApiClientOptions = {},
): Promise<ApiResponse> {
  const normalizedRequest: NormalizedApiRequest = {
    ...request,
    method: request.method ?? 'GET',
    headers: request.headers ?? {},
  };

  try {
    return await directApiRequest(normalizedRequest);
  } catch (error) {
    if (!options.proxyOnBrowserBlock || !isBrowserFetchBlocked(error)) {
      throw error;
    }
  }

  return await callCorsProxy(normalizedRequest);
}

export function buildUrlWithQueryParams(
  target: string,
  queryParams: { key: string; value: string }[] | undefined,
) {
  const query = new URLSearchParams();
  if (queryParams) {
    for (const q of queryParams) {
      if (q.key) query.append(q.key, q.value);
    }
  }

  const queryString = query.toString();
  return queryString ? `${target}?${queryString}` : target;
}

async function directApiRequest(request: NormalizedApiRequest) {
  const fetchOptions: RequestInit = {
    method: request.method,
    headers: request.headers,
  };

  if (request.method !== 'GET' && request.body !== undefined) {
    fetchOptions.body = request.body;
  }

  const response = await fetch(request.url, fetchOptions);
  const parsedResponse = await parseResponseData(response);

  return {
    ...parsedResponse,
    proxied: false,
  };
}

async function parseResponseData(response: Response): Promise<ApiResponse> {
  const contentType = response.headers.get('content-type');

  let responseData: unknown;
  if (contentType?.includes('application/json')) {
    responseData = await response.json();
  } else {
    responseData = await response.text();
  }

  return {
    status: response.status,
    statusText: response.statusText,
    headers: headersToObject(response.headers),
    data: responseData,
    proxied: false,
  };
}

function headersToObject(headers: Headers) {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key] = value;
  });

  return result;
}

function isBrowserFetchBlocked(error: unknown) {
  if (!(error instanceof TypeError)) return false;

  const message = error.message.toLowerCase();
  return (
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('load failed')
  );
}
