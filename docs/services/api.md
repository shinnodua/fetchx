# API Services

API services live under `src/services/api/` and own fetch-based side effects.

## Source map

- `config.ts`: API base URLs, Fetchx API configuration checks, URL builders.
- `httpClient.ts`: normalized fetch client, response parsing, CORS proxy fallback, sensitive proxy confirmation.
- `proxyClient.ts`: Fetchx proxy API request.
- `rpcTransport.ts`: CORS-aware fetch adapter for Viem JSON-RPC transports.
- `restApi.ts`: workspace REST request execution.
- `contractExplorerApi.ts`: Fetchx contract-info client.
- `bytecodeAbiApi.ts`: Fetchx decode-abi client.
- `desktopReleaseApi.ts`: desktop release/download API client.
- `errors.ts`: backend error message normalization.
- `types.ts`: shared API request/response types.
- `index.ts`: service barrel exports.

## Rules

- Components, hooks, stores, and pages should not add direct `fetch` calls.
- New fetch-based API clients belong in this folder.
- Shared base URLs belong in `config.ts`.
- Clients should reuse `apiRequest` unless they have a strong reason not to.
- Export new clients from `index.ts` when they are used outside this folder.

## `apiRequest`

`apiRequest(request, options)` normalizes:

- method defaulting to `GET`;
- headers defaulting to `{}`;
- response data parsing;
- `proxied` response metadata.

Direct responses are parsed as JSON when content type includes `application/json`; otherwise they are parsed as text.

## Proxy fallback

Proxy fallback is opt-in with:

```ts
{ proxyOnBrowserBlock: true }
```

Fallback happens only when:

- Fetchx API is configured;
- the target origin is not the Fetchx origin;
- the origin is already known blocked, or direct fetch throws a browser CORS/access-control error;
- sensitive proxy confirmation passes when credential-like data is present.

Browser block detection intentionally checks for explicit CORS/access-control wording. Do not broaden it to every network error.

## Sensitive proxy confirmation

Before using the proxy, `httpClient.ts` checks for sensitive-looking data in:

- header names;
- query parameter names;
- body field names.

If found, the user must confirm before the proxy call is made. If no browser `confirm` exists, confirmation fails closed.

## REST API client

`executeRestApiCall` converts workspace request rows to an API request:

- appends query parameters to the target URL;
- converts header rows to an object;
- prepares raw, form-data, or x-www-form-urlencoded bodies;
- calls `apiRequest` with proxy fallback enabled.

## Contract RPC transport

Wagmi/Viem contract reads use `createCorsProxyFetch` as their HTTP transport.
This keeps JSON-RPC requests direct-first while allowing browser CORS blocks to
retry through the Fetchx proxy, just like REST requests. Contract RPC requests
that receive a direct `403 Forbidden` response also retry through the proxy,
which supports public RPC providers that reject browser-origin traffic.

## Fetchx service clients

`contractExplorerApi.ts` and `bytecodeAbiApi.ts` call the Fetchx backend.

Both use `buildFetchxApiUrl`, fail clearly when missing config, send JSON, and normalize backend errors through `getApiErrorMessage`.

Current Fetchx-backed workspace operations include:

- contract info lookup with ABI loading;
- bytecode ABI inference.

## API domain migration and disabled config

Set `VITE_API_URL_FETCHX` to the Fetchx API origin that serves `/proxy`. During the Call3-to-Fetchx migration, `VITE_API_URL_CALL3` remains a fallback only when the new setting is absent. Remove the legacy setting after deployments have been updated.

If neither setting is configured, direct requests can still succeed for CORS-enabled APIs. A browser-blocked request fails with an actionable proxy configuration error instead of the generic `Failed to fetch` message.
