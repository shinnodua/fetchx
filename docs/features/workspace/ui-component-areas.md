# UI Component Areas

Workspace UI is split by product area, not by generic component type.

## Active request workspace

`ActiveRequestWorkspace` renders the main editor for the active draft:

- request name;
- save button;
- method/type selector;
- target input;
- RPC selector for contract requests;
- connect/send button;
- request settings pane;
- response pane.

It receives orchestration callbacks from `WorkspacePage` and `useRequestRunner`. It should stay focused on composition and event forwarding.

## Request settings

`RequestSettings` reads the active draft from `useWorkspaceStore` and selects:

- `RestRequestSettings` for REST methods;
- `ContractRequestSettings` for `READ`, `WRITE`, and `SEND`.

This keeps method-specific UI separate while preserving a stable parent layout.

## Response area

`ResponsePane` and `ResponsePayloadViewer` display the current response and saved responses.

Responses should already be redacted before they are written to UI state. Display components should not be responsible for resolving or redacting environment variables.

## Tabs

Tab UI lives under `components/request/navigation/`.

It owns:

- open tab rendering;
- active tab selection;
- tab reordering;
- close behavior;
- tab context menu.

Unsaved changes are handled through store dirty-state checks and close confirmation state.

## Request dialogs

Request-related dialogs live under `components/request/dialogs/`.

Examples:

- `WorkspaceDialogs`;
- `ManageRpcsDialog`;
- `ManageAbisDialog`;
- `SaveAbiDialog`.

Keep dialogs close to the request feature when they primarily support request authoring.

## Collection sidebar

Collection components live under `components/collection/`.

The sidebar should own collection-oriented workflows only. Avoid pushing request editor behavior into the sidebar unless it is specifically about opening, creating, importing, duplicating, renaming, deleting, or revealing requests.

## Environment components

Environment components live under `components/environment/`.

They own environment management and environment-aware input overlays. The overlay field components are shared inside the workspace feature but should not become global UI primitives unless another feature needs placeholder resolution.

## Design system usage

Workspace UI must use the Flamingo design system from `src/components` for buttons, inputs, selects, dialogs, and related primitives.

Do not bypass the design system with raw interactive elements when a shared component exists.

Use theme tokens from `src/index.css` and existing component variants rather than arbitrary color classes.
