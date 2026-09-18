# Collections And Imports

Collections group saved requests in the workspace sidebar.

## Collection model

`CollectionItem` contains:

- `id`;
- `name`;
- `requests`.

`RequestItem` contains the request configuration, current response, and saved responses.

Collections are persisted by `useWorkspaceStore` under `fetchx-workspace-storage`.

## Sidebar behavior

Collection UI lives under `src/features/workspace/components/collection/`.

It owns:

- collection rendering;
- request rendering inside collections;
- collection and request context menus;
- collection add/rename/duplicate/delete flows;
- import/export controls;
- sidebar header;
- collection dialog coordination.

Collapsed collection ids and sidebar width/collapsed state live in `useWorkspaceStore`.

Collection rows use compact vertical gaps and slim selected or hover surfaces so
more requests and saved responses remain visible in the sidebar.

Each collection's three-dot menu includes **Reorder**. It opens the full-viewport
**Manage Collections** dialog with the complete collection tree, including every request nested under its
collection. As a row is dragged, an insertion line shows whether it will land
before or after the hovered row and the list immediately previews that new
position. Drag collection rows to reorder collections, or drag a request within
the same collection to reorder that collection's requests.
Collection request lists start collapsed in the dialog and can be expanded with
their chevron control.
The dialog only saves the staged order after **Save order** is selected; the
persisted workspace state restores that order after restart.

## Workspace tab ordering

Open workspace tabs can be reordered directly in the tab strip. Dragging a tab
uses an insertion line and immediately previews its new position; dropping keeps
that staged order in the persisted workspace state.

## Collection actions

Collection actions live in `src/store/workspace/collectionActions.ts`.

Important behavior:

- names are trimmed;
- empty names are ignored or normalized depending on action;
- duplicate names are prevented for add/rename;
- duplicate collections deep-copy requests and clear current responses;
- deleting a collection closes tabs for requests in that collection and removes related drafts;
- imports rename incoming collections when needed to avoid name collisions.

## Request actions

Request actions live in `src/store/workspace/requestActions.ts`.

Important behavior:

- adding a request creates it inside a collection, opens a tab, and creates a draft;
- importing/custom request creation opens an unsaved draft tab without immediately inserting into a collection;
- renaming updates both saved request and draft when present;
- duplication clears the current response and opens the duplicated request;
- deleting a request closes its tab and removes its draft.

## Export payload

`createCollectionsExportPayload(collections)` returns:

```json
{
  "version": 1,
  "exportedAt": "ISO timestamp",
  "collections": []
}
```

Requests are normalized on export:

- `args`, `headers`, and `queryParams` default to empty structures;
- `body` defaults to an empty string;
- `response` is set to `null`;
- `savedResponses` are preserved;
- `savedResponsesCollapsed` defaults to `false`.

## Fetchx import payload

`parseCollectionsImportPayload(content)` accepts either:

- a full Fetchx export object with `collections`;
- an array of collection objects.

The parser validates collection, request, key/value, and saved response shapes. Invalid data throws a clear import error.

Incoming request responses are reset to `null` during normalization. Saved responses are preserved when valid.

## Postman import

Before parsing Fetchx format, `parseCollectionsImportPayload` checks `canParsePostmanCollection(parsed)`. If true, it delegates to `parsePostmanCollection`.

Postman import support belongs in `src/features/workspace/utils/postmanCollectionImport.ts`. Keep new third-party collection formats separate from Fetchx export parsing so the native import contract remains stable.

## Paste import

The target input paste flow uses `parseRequestImportContent`.

Supported content:

- HTTP(S) URL;
- cURL command;
- fetch snippet.

For HTTP(S) URLs, paste updates the target, query params, and generates a
request name using the selected request method (for example,
`POST api.example.com/users`).

For cURL/fetch snippets, paste updates:

- generated request name;
- method;
- target;
- headers;
- query params;
- body;
- ABI/function/args reset for REST mode;
- response reset.

## Naming

`createImportedRequestName(method, target)` attempts to generate readable names such as:

```text
GET api.example.com/users
```

If the generated name is too long, it falls back to method plus hostname. If URL parsing fails, it uses `Imported Request`.
