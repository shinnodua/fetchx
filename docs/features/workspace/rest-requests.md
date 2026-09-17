# REST Requests

REST requests cover user-defined HTTP calls in the workspace. Supported methods are defined in `METHOD_OPTIONS`, `REST_METHODS`, and related helpers in `src/features/workspace/constants.ts`.

## Request fields

REST requests use these `RequestItem` fields:

- `type`: HTTP method such as `GET`, `POST`, `PUT`, `PATCH`, or `DELETE`.
- `target`: URL endpoint without query parameters when parsed through the import helpers.
- `headers`: key/value rows.
- `queryParams`: key/value rows appended to the target at send time.
- `body`: raw body text.
- `bodyType`: `raw`, `form-data`, or `x-www-form-urlencoded`.
- `formData`: key/value rows used by form-data modes.
- `response`: current execution result.
- `savedResponses`: named response snapshots.

## UI behavior

`RestRequestSettings` owns REST-specific controls. Request data inputs should support environment variables through the environment-aware field components where applicable.

The target input in `ActiveRequestWorkspace` accepts pasted URLs, cURL commands, and fetch snippets. Paste handling is centralized in `useRequestRunner.handleTargetPaste` and `src/features/workspace/utils/requestImport.ts`.

## Import behavior

`parseRequestImportContent(content)` supports:

- plain `http://` and `https://` URLs;
- cURL commands;
- JavaScript `fetch(...)` snippets.

URL query strings are split into `queryParams`, while the `target` becomes origin plus pathname.

cURL import supports common request features:

- `-X` or `--request` for method;
- `-H` or `--header` for headers;
- `-d`, `--data`, `--data-raw`, `--data-binary`, `--data-ascii`, and `--data-urlencode` for body;
- `-u` or `--user` converted to a Basic Authorization header;
- `--url` for explicit target.

Browser-only or unsafe copied headers are filtered out, including `sec-*`, `origin`, `referer`, `user-agent`, `host`, `connection`, and `accept-encoding`.

## Execution path

REST execution follows this path:

```text
useRequestRunner.handleRunRequest
  -> useRunRestRequest.runRestRequest
  -> requestExecutor.executeRestCall
  -> services/api/restApi.executeRestApiCall
  -> services/api/httpClient.apiRequest
```

`executeRestApiCall` builds the final URL with query parameters and prepares request body/header state:

- raw mode sends `body` as-is;
- `x-www-form-urlencoded` builds a `URLSearchParams` body and sets `content-type`;
- `form-data` builds a `FormData` body and leaves content type to the browser.

## Direct-first transport

REST requests are direct-first. The browser attempts to call the target URL directly before any proxy is used.

The Fetchx proxy fallback is only enabled with `proxyOnBrowserBlock: true`, and only when the caught browser error is explicitly classified as CORS/access-control related by `isBrowserFetchBlocked`.

Do not route all REST traffic through the proxy by default.

Contract `READ` calls use the same direct-first CORS fallback through their
Viem JSON-RPC transport. Unlike REST requests, contract reads also retry a
direct `403 Forbidden` response through the proxy because some public RPC
providers reject browser-origin traffic.

## CORS proxy fallback

When direct fetch fails due to a CORS/access-control browser block:

1. `apiRequest` marks the origin as blocked in `useCorsStore`.
2. Future matching origins can skip direct fetch and use proxy fallback immediately.
3. Before proxying, `confirmSensitiveProxyRequest` checks for credential-like data.
4. If sensitive-looking headers, query params, or body fields exist, the user must confirm proxying.
5. If confirmation is denied, execution fails before sending credential-like data through the proxy.

Credential-like fields include common names such as authorization, password, secret, token, API key, client secret, access token, and refresh token.

## Response handling

`directApiRequest` parses JSON responses when the content type includes `application/json`; otherwise it reads text. The normalized response includes status, status text, headers, data, and `proxied`.

`useRunRestRequest` writes the final response into the active draft and adds logs for:

- target URL;
- proxy retry when used;
- HTTP status;
- response received;
- duration.

Final response logs append to the existing Console Logs history for the request, so repeated runs remain visible until the page is refreshed or the tab is closed.

Response data is redacted against active sensitive environment values before it is stored in UI state.
