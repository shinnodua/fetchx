# Workspace Feature

The workspace is the main Fetchx product surface. It lets users create collections of requests, edit requests in tabs, execute REST and EVM requests, manage environments, import/export collections, and save responses.

## Source map

- `src/features/workspace/WorkspacePage.tsx`: top-level workspace orchestration.
- `src/features/workspace/components/`: feature UI split into collection, environment, and request areas.
- `src/features/workspace/hooks/`: workspace-only stateful orchestration hooks.
- `src/features/workspace/utils/`: parsers, formatters, redaction helpers, import/export helpers, ABI helpers, and dirty-state logic.
- `src/features/workspace/constants.ts`: method lists, default collections, networks, and built-in ABI metadata.
- `src/features/workspace/types.ts`: domain types for requests, collections, responses, ABIs, RPCs, and environments.
- `src/store/workspace/`: persisted workspace state and actions.
- `src/store/environment/`: persisted environment and sensitive-value state.
- `src/store/rpc/`: persisted custom RPCs.
- `src/store/abi/`: persisted saved ABI library.
- `src/services/requestExecutor.ts`: execution boundary for REST and EVM calls.
- `src/services/api/`: shared HTTP clients and Fetchx backend clients.

## Docs in this folder

- [Architecture](./architecture.md): ownership boundaries and component/module responsibilities.
- [Request lifecycle](./request-lifecycle.md): what happens from edit to send to response.
- [REST requests](./rest-requests.md): HTTP request model, import behavior, body modes, and proxy fallback.
- [Contract requests](./contract-requests.md): READ, WRITE, SEND, simulation, ABI parsing, and wallet/network behavior.
- [Environments](./environments.md): variable resolution, sensitive values, encryption, unlocking, and redaction.
- [Collections and imports](./collections-and-imports.md): sidebar model, import/export payloads, Postman support, cURL/fetch parsing.
- [State and persistence](./state-and-persistence.md): saved collections, drafts, tabs, responses, and store action slices.
- [ABI and RPC management](./abi-and-rpc-management.md): auto-load, bytecode fallback service client, saved ABI library, and custom RPCs.
- [UI component areas](./ui-component-areas.md): request workspace, settings panes, response pane, dialogs, tabs, and sidebar.

## Core concepts

The workspace edits `RequestItem` records. A request can be a REST method, `READ`, `WRITE`, or `SEND`. Saved requests live inside `CollectionItem.requests`; open request edits live in `drafts` keyed by tab/request id.

Execution always works from the active draft. Before execution, environment variables are resolved into a real request and a redacted request. The real request is sent to services. The redacted request is used for logs and UI-safe output.

The page is intentionally thin. `WorkspacePage` wires stores, hooks, the active request, dirty state, ABI auto-load, public client selection, and the main child components. It should not accumulate parsers, network clients, or heavy JSX.

## Important invariants

- Request editing should update drafts first. Persisting to collections happens through `saveDraft`.
- Request data fields that can contain `{{variables}}` should use environment-aware fields in workspace UI.
- REST requests should use the shared API service path so direct-first fetch and proxy fallback stay consistent.
- Contract execution should go through `useRunContractRequest` and `src/services/requestExecutor.ts`.
- ABI import and bytecode decode requests should go through `src/services/api/*`, not component-level fetch calls.
- Sensitive variable plaintext must not be persisted; it is kept in memory only after unlock.
- New workspace utilities should live in `src/features/workspace/utils/` with colocated tests.
