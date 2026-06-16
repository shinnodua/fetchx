import { useCorsStore } from '../../store';
import { API_BASE_URLS } from './config';
import { callCorsProxy } from './proxyClient';
import type { ApiRequest, ApiResponse } from './types';

export interface ApiClientOptions {
  proxyOnBrowserBlock?: boolean;
  confirmProxyForSensitiveRequest?: (
    risk: SensitiveProxyRisk,
  ) => boolean | Promise<boolean>;
}

interface NormalizedApiRequest extends ApiRequest {
  method: string;
  headers: Record<string, string>;
}

interface SensitiveProxyRisk {
  headerNames: string[];
  queryParamNames: string[];
  bodyFieldNames: string[];
}

function getUrlOrigin(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

function getSensitiveProxyRisk(
  request: NormalizedApiRequest,
): SensitiveProxyRisk {
  return {
    headerNames: getSensitiveHeaderNames(request.headers),
    queryParamNames: getSensitiveQueryParamNames(request.url),
    bodyFieldNames: getSensitiveBodyFieldNames(request.body),
  };
}

function hasSensitiveProxyRisk(risk: SensitiveProxyRisk) {
  return (
    risk.headerNames.length > 0 ||
    risk.queryParamNames.length > 0 ||
    risk.bodyFieldNames.length > 0
  );
}

function getSensitiveHeaderNames(headers: Record<string, string>) {
  const sensitiveHeaderNames = new Set([
    'authorization',
    'cookie',
    'proxy-authorization',
    'x-api-key',
    'x-auth-token',
  ]);

  return Object.keys(headers).filter((headerName) => {
    const normalizedHeaderName = headerName.trim().toLowerCase();
    return (
      sensitiveHeaderNames.has(normalizedHeaderName) ||
      normalizedHeaderName.includes('token') ||
      normalizedHeaderName.includes('secret') ||
      normalizedHeaderName.includes('apikey') ||
      normalizedHeaderName.includes('api-key')
    );
  });
}

function getSensitiveQueryParamNames(url: string) {
  try {
    const targetUrl = new URL(url);
    return Array.from(targetUrl.searchParams.keys()).filter((key) =>
      isSensitiveFieldName(key),
    );
  } catch {
    return [];
  }
}

function getSensitiveBodyFieldNames(body: ApiRequest['body']) {
  if (typeof body !== 'string') return [];
  return getSensitiveBodyTextFieldNames(body);
}

function getSensitiveBodyTextFieldNames(body: string) {
  const trimmedBody = body.trim();
  if (!trimmedBody) return [];

  try {
    const parsed: unknown = JSON.parse(trimmedBody);
    return getSensitiveJsonFieldNames(parsed);
  } catch {
    const params = new URLSearchParams(trimmedBody);
    return Array.from(params.keys()).filter((key) => isSensitiveFieldName(key));
  }
}

function getSensitiveJsonFieldNames(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(getSensitiveJsonFieldNames);
  if (typeof value !== 'object' || value === null) return [];

  return Object.entries(value).flatMap(([key, childValue]) =>
    isSensitiveFieldName(key) ? [key] : getSensitiveJsonFieldNames(childValue),
  );
}

function isSensitiveFieldName(fieldName: string) {
  const normalizedName = fieldName.trim().toLowerCase();
  return (
    normalizedName === 'authorization' ||
    normalizedName === 'password' ||
    normalizedName === 'passwd' ||
    normalizedName === 'secret' ||
    normalizedName === 'client_secret' ||
    normalizedName === 'access_token' ||
    normalizedName === 'refresh_token' ||
    normalizedName === 'api_key' ||
    normalizedName === 'apikey' ||
    normalizedName.includes('token') ||
    normalizedName.includes('secret') ||
    normalizedName.includes('password') ||
    normalizedName.includes('api_key') ||
    normalizedName.includes('apikey') ||
    normalizedName.includes('api-key')
  );
}

async function confirmSensitiveProxyRequest(
  request: NormalizedApiRequest,
  options: ApiClientOptions,
) {
  const risk = getSensitiveProxyRisk(request);
  if (!hasSensitiveProxyRisk(risk)) return;

  const confirmProxy =
    options.confirmProxyForSensitiveRequest ?? confirmProxyWithBrowserDialog;
  const confirmed = await confirmProxy(risk);
  if (!confirmed) {
    throw new Error(
      'Browser request appears to be CORS-blocked, but proxy retry was canceled before sending credential-like data through the proxy.',
    );
  }
}

function confirmProxyWithBrowserDialog(risk: SensitiveProxyRisk) {
  if (typeof globalThis.confirm !== 'function') {
    return false;
  }

  return globalThis.confirm(
    `Browser request appears to be CORS-blocked. Retry through the Call3 proxy?\n\nThis request includes credential-like data that will be sent through the proxy:\n${formatSensitiveProxyRisk(risk)}\n\nContinue?`,
  );
}

function formatSensitiveProxyRisk(risk: SensitiveProxyRisk) {
  const parts = [
    formatSensitiveProxyRiskPart('Headers', risk.headerNames),
    formatSensitiveProxyRiskPart('Query params', risk.queryParamNames),
    formatSensitiveProxyRiskPart('Body fields', risk.bodyFieldNames),
  ].filter(Boolean);

  return parts.join('\n');
}

function formatSensitiveProxyRiskPart(label: string, names: string[]) {
  if (names.length === 0) return '';
  return `- ${label}: ${Array.from(new Set(names)).join(', ')}`;
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

  const origin = getUrlOrigin(normalizedRequest.url);
  const call3Origin = getUrlOrigin(API_BASE_URLS.call3);
  const isCall3Origin = origin && call3Origin && origin === call3Origin;

  // Check if we should bypass direct request because origin is known to be blocked by CORS
  if (
    options.proxyOnBrowserBlock &&
    origin &&
    !isCall3Origin &&
    useCorsStore.getState().isOriginBlocked(origin)
  ) {
    await confirmSensitiveProxyRequest(normalizedRequest, options);
    return await callCorsProxy(normalizedRequest);
  }

  try {
    return await directApiRequest(normalizedRequest);
  } catch (error) {
    if (
      !options.proxyOnBrowserBlock ||
      isCall3Origin ||
      !isBrowserFetchBlocked(error)
    ) {
      throw error;
    }

    // The browser explicitly reported a CORS-blocked response.
    if (origin) {
      useCorsStore.getState().markOriginAsBlocked(origin);
    }
  }

  await confirmSensitiveProxyRequest(normalizedRequest, options);
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

  const messages = [error.message];
  if (
    typeof error.cause === 'object' &&
    error.cause !== null &&
    'message' in error.cause &&
    typeof error.cause.message === 'string'
  ) {
    messages.push(error.cause.message);
  }

  const message = messages.join(' ').toLowerCase();
  return (
    message.includes('cors') ||
    message.includes('cross-origin') ||
    message.includes('access-control-allow-origin') ||
    message.includes('blocked by access control')
  );
}
