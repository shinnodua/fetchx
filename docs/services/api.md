# API Services

API services live under `src/services/api/` and own fetch-based side effects.

## Source map

- `config.ts`: API base URLs, Call3 API configuration checks, URL builders.
- `httpClient.ts`: normalized fetch client, response parsing, CORS proxy fallback, sensitive proxy confirmation.
- `proxyClient.ts`: Call3 proxy API request.
- `restApi.ts`: workspace REST request execution.
- `contractExplorerApi.ts`: Call3 contract-info client.
- `bytecodeAbiApi.ts`: Call3 decode-abi client.
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

- Call3 API is configured;
- the target origin is not the Call3 origin;
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

## Call3 service clients

`contractExplorerApi.ts` and `bytecodeAbiApi.ts` call the Call3 backend.

Both use `buildCall3ApiUrl`, fail clearly when missing config, send JSON, and normalize backend errors through `getApiErrorMessage`.

Current Call3-backed workspace operations include:

- contract info lookup with ABI loading;
- bytecode ABI inference.

## Disabled API config

Missing or blank `VITE_API_URL_CALL3` is a deliberate disabled state. API clients should throw clear configuration errors instead of constructing invalid URLs or falling back to accidental endpoints.
