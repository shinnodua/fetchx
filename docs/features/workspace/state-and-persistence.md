# State And Persistence

Workspace state is persisted through Zustand.

## Workspace sources

`Local Workspace` is the permanent default source. GitHub workspace descriptors
are also persisted locally so users can switch between sources. Each descriptor
contains a display name, non-secret repository metadata, and the mode that
authorized it. Access tokens and OAuth refresh tokens are kept in the desktop
credential store, never in Zustand or browser storage.

Switching workspaces saves the current collection snapshot, loads the selected
collection snapshot, and clears transient tabs and drafts. See
[GitHub workspaces](./github-workspaces.md) for the repository file format and
manual sync behavior.

## Store files

- `src/store/workspace/useWorkspaceStore.ts`: store creation and persistence setup.
- `workspaceStoreTypes.ts`: full state and action contract.
- `workspaceStoreActions.ts`: combines action slices.
- `collectionActions.ts`: collection CRUD and import.
- `requestActions.ts`: request CRUD and custom request creation.
- `tabActions.ts`: tab open/close/reorder/reveal/new-tab behavior.
- `draftActions.ts`: active request updates, draft save/discard/init, logs.
- `responseActions.ts`: saved response creation, collapse toggle, delete.
- `setterActions.ts`: simple setter actions.
- `workspaceStoreUtils.ts`: id creation, cloning, default request creation, lookup helpers.

## Persisted key

The workspace store persists under:

```text
fetchx-workspace-storage
```

On rehydrate, transient `abiLoading` is reset to `false`.

## Saved state versus draft state

Saved state:

- lives in `collections[*].requests[*]`;
- is durable user data;
- is used for sidebar rendering and persisted request collections.

Draft state:

- lives in `drafts[requestId]`;
- is the editable copy for open tabs;
- is the source used for request execution;
- may represent either an existing saved request or a new unsaved tab.

`WorkspacePage` and request settings always prefer draft state over saved state when both exist.

## Tab state

Tabs are stored as request ids in `tabs`. The active tab id is `activeTabId`.

Opening an existing request:

- appends the request id to `tabs` if not already open;
- sets `activeTabId`;
- initializes a draft from the saved request when needed.

Closing a tab:

- removes the id from `tabs`;
- resets or removes draft state through `resetDraftForClosedTab`;
- selects another remaining tab or clears `activeTabId`.

New tabs use temporary ids that start with `r-new-`.

## Draft save/discard

`saveDraft(reqId, colId)` persists the current draft.

For new requests:

- creates a normal request id;
- inserts the request into the target collection;
- replaces the tab id;
- moves the draft under the new id.

For existing requests:

- replaces the matching request in collections;
- keeps the draft active.

`discardDraft(reqId)` removes a new unsaved tab or resets an existing draft from saved state.

`discardDraftChanges(reqId)` resets draft contents but keeps the tab open.

## Logs

`addLog(reqId, log)` prepends a timestamp and writes to:

- the request draft response logs when a draft exists;
- the saved request response logs when a saved request exists.

Response updates append their final summary logs to the existing response logs instead of replacing the console history. This keeps all runs for the request visible in Console Logs during the current page session.

Console Logs are treated as session-only debug output. Persisted workspace state is rehydrated without response logs, so refreshing the page or reopening the tab starts the log history clean while preserving the rest of the workspace state.

## Saved responses

`saveActiveResponse(name)` requires:

- active draft exists;
- current response exists;
- response data is not `undefined` or `null`;
- provided name is not empty.

It stores a named `SavedResponse` with id, name, ISO timestamp, and deep-cloned response.

Saved responses are updated in the draft and mirrored to the saved request when present.

## Sidebar state

Workspace store also owns:

- `searchTerm`;
- `collapsedCollectionIds`;
- `collectionsPanelWidth`;
- `collectionsPanelCollapsed`;
- `requestToRevealId`.

`revealRequestInSidebar(reqId)` expands the owning collection, clears search, opens the sidebar, sets the active tab, and marks the request for reveal.

## Dialog state

The workspace store owns open state and temporary values for:

- new collection dialog;
- new request dialog;
- request import dialog;
- contract import dialog;
- tab close confirmation.

Environment, ABI, and RPC management use their own stores because they are shared capabilities beyond the collection/request tree.
