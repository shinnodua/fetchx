# Request Lifecycle

This doc traces a request from editing to execution and response display.

## 1. Opening a request

Requests are opened as tabs through workspace store tab actions:

- existing saved requests are opened with `openTab(reqId)`;
- new unsaved requests are created with `addNewTab()`;
- imported/custom requests are created with `addCustomRequest(...)`.

When a saved request opens, the store creates a draft copy. The draft is the active editing surface. Saved collections remain unchanged until `saveDraft` runs.

## 2. Editing fields

`ActiveRequestWorkspace` renders shared request controls:

- request name;
- method or request type;
- target URL, contract address, or recipient address;
- network/RPC selector for contract request types;
- save and send/connect buttons.

`RequestSettings` switches between:

- `RestRequestSettings` for REST methods;
- `ContractRequestSettings` for `READ`, `WRITE`, and `SEND`.

Edits call `updateActiveRequest(fields)`, which updates only `drafts[activeTabId]`.

## 3. Dirty state

`WorkspacePage` computes dirty state by comparing the active draft with the saved request from collections using `getRequestIsDirty`.

Dirty state controls whether the save button is active. New tabs with ids starting `r-new-` must be saved into a collection before they become normal saved requests.

## 4. Saving

`useRequestRunner.handleSaveActiveRequest` chooses the target collection and calls `saveDraft(activeTabId, selectedCollectionId)`.

For new requests:

- the temporary `r-new-*` id is replaced with a normal request id;
- the tab id is updated to the saved id;
- the request is inserted into the selected collection;
- the draft is preserved under the saved id.

For existing requests:

- the matching request inside collections is replaced with the draft;
- the draft remains active.

## 5. Preparing execution

`handleRunRequest` reads the freshest active environment from `useEnvironmentStore.getState()` to avoid stale closures.

It gathers all text fields that may contain variables:

- target;
- body;
- header keys and values;
- query parameter keys and values;
- contract argument values.

It then checks for locked sensitive variables. If a referenced sensitive variable has no plaintext value in memory, execution opens `UnlockSensitiveDialog` and stops.

## 6. Resolving variables

Before sending, `prepareResolvedRequest` creates two request copies:

- `resolved`: contains real environment variable values and is sent to services;
- `redacted`: replaces sensitive values with `[REDACTED]` and is used in logs.

This split is central to keeping execution correct while preventing secrets from appearing in the response log.

## 7. Dispatching execution

`isRestMethod(resolved.type)` decides the execution path.

REST methods call:

```text
useRequestRunner -> useRunRestRequest -> executeRestCall -> executeRestApiCall -> apiRequest
```

Contract request types call:

```text
useRequestRunner -> useRunContractRequest -> requestExecutor -> viem/wagmi client
```

`WRITE` simulation calls `handleSimulateRequest`, which shares the sensitive unlock and variable resolution model but always dispatches to `simulateContractRequest`.

## 8. Response updates

Before execution, the active draft response is set to:

```json
{
  "status": "Pending",
  "data": null,
  "duration": 0,
  "logs": []
}
```

Execution hooks update the active draft with final response state:

- REST: HTTP status text, parsed response data, duration, and logs.
- READ: `Success` with decoded data or raw data if decode fails.
- WRITE: `Sent` or `Confirmed` with transaction hash and receipt details.
- SEND: `Sent` or `Confirmed` with native transfer details.
- Simulation: `Success` with simulation result or a success marker.
- Error: `Error` with redacted error data and logs.

## 9. Saving responses

`saveActiveResponse(name)` copies the current draft response into `savedResponses`. It deep-clones through JSON serialization so the saved response does not mutate with later response edits.

Saved responses are mirrored into both the active draft and the saved collection request when the request exists in collections.

## 10. Error handling

`handleRunRequest` catches execution errors, normalizes wallet/provider messages through `getWalletErrorMessage`, redacts sensitive values, writes an error log, updates response state, and shows a toast.

REST keeps the original error message in logs when possible. User-facing data may replace generic `Failed to fetch` with a clearer browser/CORS/host-unreachable message.
