import { apiRequest } from './httpClient';

type ApiRequestExecutor = typeof apiRequest;

/**
 * Creates a fetch implementation for JSON-RPC transports that retries browser
 * CORS blocks through the Fetchx proxy.
 */
export function createCorsProxyFetch(
  executeApiRequest: ApiRequestExecutor = apiRequest,
): typeof fetch {
  return async (input, init) => {
    const request = new Request(input, init);
    const body =
      request.method === 'GET' || request.method === 'HEAD'
        ? undefined
        : await request.text();
    const response = await executeApiRequest(
      {
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        body,
      },
      {
        proxyOnBrowserBlock: true,
        proxyOnForbiddenResponse: true,
      },
    );

    return new Response(serializeResponseBody(response.data), {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  };
}

function serializeResponseBody(data: unknown) {
  if (data === undefined || data === null) return null;
  return typeof data === 'string' ? data : JSON.stringify(data);
}
