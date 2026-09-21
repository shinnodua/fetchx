# UI Component Areas

Workspace UI is split by product area, not by generic component type.

## Active request workspace

`ActiveRequestWorkspace` renders the main editor for the active draft. Its
editable request title uses the compact `text-base` scale to preserve room for
request controls and output:

- request name;
- save button;
- method/type selector;
- target input;
- RPC selector for contract requests;
- contextual wallet connection, account management, network state, and send controls for `WRITE` and `SEND` requests;
- request settings pane;
- response pane.

The request method selector and collection method badges share the same
primary/secondary text-color mapping for every request method.

It receives orchestration callbacks from `WorkspacePage` and `useRequestRunner`. It should stay focused on composition and event forwarding.

## Request settings

`RequestSettings` reads the active draft from `useWorkspaceStore` and selects:

- `RestRequestSettings` for REST methods;
- `ContractRequestSettings` for `READ`, `WRITE`, and `SEND`.

This keeps method-specific UI separate while preserving a stable parent layout.

## Response area

`ResponsePane` and `ResponsePayloadViewer` display the current response and saved responses.

Payload preview and raw views use compact 11px monospace text, slim rows, and
tight preview/raw tabs so more output can be reviewed without scrolling.
Preview row separators are dashed, begin at each key label, and inherit its
nesting offset. The preview card matches the response pane's `rounded-2xl`
radius.
The active payload card fills the remaining response-pane height and scrolls its
content internally; the surrounding Payload Output component does not scroll.
When response logs exist, `ResponsePane` exposes a Logs button that opens them
in a dedicated scrollable dialog instead of consuming space beneath the payload.

Responses should already be redacted before they are written to UI state. Display components should not be responsible for resolving or redacting environment variables.

## Tabs

Tab UI lives under `components/request/navigation/`.

The workspace tab header uses 11px labels, an 8-unit tab height, and slim
vertical spacing so more request tabs fit in the editor.

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
