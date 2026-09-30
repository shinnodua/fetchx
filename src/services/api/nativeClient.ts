import {
  executeNativeHttpRequest,
  type NativeHttpResponsePayload,
} from '../platform';
import type { NormalizedApiRequest } from './httpClient';
import type { ApiResponse } from './types';

export async function executeNativeRequest(
  request: NormalizedApiRequest,
  executeNative: typeof executeNativeHttpRequest = executeNativeHttpRequest,
): Promise<ApiResponse> {
  const { bodyString, headers } = await serializeNativeRequestBody(
    request.body,
    request.headers,
  );

  const nativeResponse = await executeNative({
    url: request.url,
    method: request.method,
    headers,
    body: bodyString,
  });

  return parseNativeResponse(nativeResponse);
}

export function parseNativeResponse(
  response: NativeHttpResponsePayload,
): ApiResponse {
  const contentType =
    response.headers['content-type'] || response.headers['Content-Type'];

  let responseData: unknown = response.body;
  if (contentType?.includes('application/json')) {
    try {
      responseData = JSON.parse(response.body);
    } catch {
      responseData = response.body;
    }
  }

  return {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
    data: responseData,
    proxied: false,
  };
}

export async function serializeNativeRequestBody(
  body: NormalizedApiRequest['body'],
  headers: Record<string, string>,
): Promise<{ bodyString?: string; headers: Record<string, string> }> {
  if (body == null) {
    return { headers };
  }

  if (typeof body === 'string') {
    return { bodyString: body, headers };
  }

  if (
    typeof URLSearchParams !== 'undefined' &&
    body instanceof URLSearchParams
  ) {
    const updatedHeaders = { ...headers };
    if (!hasContentType(updatedHeaders)) {
      updatedHeaders['content-type'] = 'application/x-www-form-urlencoded';
    }
    return { bodyString: body.toString(), headers: updatedHeaders };
  }

  if (typeof FormData !== 'undefined' && body instanceof FormData) {
    const boundary = `----FetchXFormBoundary${Math.random().toString(36).slice(2)}`;
    let multipart = '';
    body.forEach((value, key) => {
      multipart += `--${boundary}\r\n`;
      multipart += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
      multipart += `${typeof value === 'string' ? value : ''}\r\n`;
    });
    multipart += `--${boundary}--\r\n`;

    const updatedHeaders = { ...headers };
    updatedHeaders['content-type'] =
      `multipart/form-data; boundary=${boundary}`;
    return { bodyString: multipart, headers: updatedHeaders };
  }

  return { bodyString: String(body), headers };
}

function hasContentType(headers: Record<string, string>): boolean {
  return Object.keys(headers).some(
    (key) => key.toLowerCase() === 'content-type',
  );
}
