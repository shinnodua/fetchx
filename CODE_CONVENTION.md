# Code Convention - Call3.dev

This document establishes the architecture, folder layout, state management patterns, and coding styles for the Call3.dev repository. All contributors and AI agents must follow these guidelines.

---

## 📂 Repository Directory Layout

This project follows a **Feature-Based Architecture (Screaming Architecture)** where logic is organized around product capabilities rather than technical layers.

```
src/
├── routes/                  # TanStack Router path mapping (Strictly wrappers)
│   ├── __root.tsx           # Main shell wrapper
│   ├── index.tsx            # Home page wrapper
│   └── design-system.tsx    # Design system wrapper
├── features/                # Domain-specific code
│   ├── workspace/           # Workspace & client request feature
│   │   ├── components/      # Reusable feature UI pieces and composed views
│   │   │   ├── environment/ # Environment selector, dialog, and encryption panel
│   │   │   ├── collection/  # Collection sidebar panel and export/import tools
│   │   │   ├── request/     # Active request editor, response pane, and tabs header
│   │   │   └── index.ts     # Component barrel export file
│   │   ├── hooks/           # Workspace-only React hooks
│   │   ├── utils/           # Workspace-only pure helpers (parsing, naming, transforms)
│   │   ├── types.ts         # Domain models (RequestItem, AbiItem, etc.)
│   │   ├── constants.ts     # Pre-loaded ABIs, network lists, defaults
│   │   └── WorkspacePage.tsx# Core orchestration component
│   └── design-system/       # Design System showcase feature
│       ├── components/      # Colors, typography, component groups
│       └── DesignSystemPage.tsx
├── store/                   # Global shared Zustand stores
│   ├── index.ts             # Global exports & theme config
│   ├── environment/         # Environment state management
│   │   └── useEnvironmentStore.ts
│   ├── rpc/                 # Custom RPC endpoint persistence
│   │   └── useRpcStore.ts
│   └── workspace/           # Workspace state management
│       ├── useWorkspaceStore.ts
│       ├── workspaceStoreActions.ts
│       ├── workspaceStoreTypes.ts
│       └── workspaceStoreUtils.ts
├── services/                # Shared application services
│   ├── api/                 # HTTP API clients, base URL config, proxy fallback, response parsing
│   │   ├── config.ts        # Named API base URLs and URL helpers
│   │   ├── httpClient.ts    # Shared direct fetch + optional CORS proxy fallback
│   │   ├── proxyClient.ts   # Call3 proxy API client
│   │   ├── restApi.ts       # User-defined REST request execution
│   │   ├── contractExplorerApi.ts # Block explorer contract import API
│   │   ├── types.ts         # Shared API request/response types
│   │   └── index.ts         # API service barrel exports
│   └── requestExecutor.ts   # On-chain read/write orchestration and REST delegation
├── components/              # Shared Flamingo UI Library
│   ├── ui/                  # Raw UI building blocks (Button, Input, etc.)
│   └── index.ts             # Barrel file export
├── assets/                  # Static assets used by the application
│   ├── images/              # PNG, JPG, WebP, and other raster images
│   └── svgs/                # SVG files and reusable SVG icon components
├── utils/                   # Shared utility wrappers (cn, format, etc.)
└── main.tsx                 # App mount & router registration
```

---

## 🛠 Architectural Rules

### 1. Minimal Route Wrappers
Route files under `src/routes/` must be thin entry points. They should **only** import page-level components from `src/features/` and render them (wrapped in toast or context providers if necessary).
- ❌ **Avoid**: Writing rendering markup or state logic inside `src/routes/index.tsx`.
- **Use**:
  ```tsx
  import { WorkspacePage } from '../features/workspace/WorkspacePage';
  export const Route = createFileRoute('/')({
    component: () => <WorkspacePage />
  });
  ```

### 2. Feature Modularity
Each folder inside `src/features/` should contain self-contained types, constants, components, and hooks. Components that are only used within a single feature must live in `src/features/<feature-name>/components/`.

When a feature contains many components, group them inside `components/` into named subdirectories representing distinct sub-features (e.g., `environment/`, `collection/`, `request/`). Create a barrel `index.ts` file in the root of `components/` to export all components, which keeps external page imports clean and avoids deep nested directory import paths.

Keep files small and purpose-specific. If a file starts mixing unrelated responsibilities, split it before adding more logic. A practical target is:
- **Page files** (`WorkspacePage.tsx`, `DesignSystemPage.tsx`): orchestration only. They may wire stores, top-level hooks, URL/page state, and pass callbacks to child components.
- **View components**: larger composed UI sections for one screen area, such as `ActiveRequestWorkspace`, `WorkspaceDialogs`, or `WorkspaceEmptyState`.
- **Small components**: reusable UI pieces inside a feature, such as panels, rows, toolbars, forms, and menu triggers.
- **Hooks**: reusable stateful React logic, subscriptions, memoized selectors, and event handlers that are not pure functions.
- **Pure utilities**: deterministic parsing, formatting, naming, validation, and data transformation helpers.
- **Services**: async side effects and external integrations such as fetch, SDK calls, wallet/chain execution, persistence adapters, or file/network operations.

Do not let page or view files become dumping grounds. When a component grows because it owns multiple independent sections, split those sections into named child components and pass explicit props.

Pure functions that are specific to one feature must be moved out of page-level components and placed in `src/features/<feature-name>/utils/`. Examples include parsers, formatters, naming helpers, validators, and data transformation functions. Keep page components focused on orchestration, state wiring, and rendering.

- ❌ **Avoid**: Defining cURL parsers, JSON import transformers, or naming helpers inside `WorkspacePage.tsx`.
- **Use**:
  ```tsx
  import { parseRequestImportContent } from './utils/requestImport';
  ```

Only place utilities in global `src/utils/` when they are shared across multiple features or application layers.

### 3. Separation Rules

Use these rules when deciding where code belongs:

- **Rendering belongs in components/views**: JSX-heavy code should be extracted from page files into feature components.
- **State orchestration belongs in pages or hooks**: If logic coordinates stores, route state, wallet hooks, and child callbacks, keep it in a page only while it is small. Move repeatable or bulky stateful logic to `src/features/<feature-name>/hooks/`.
- **Pure logic belongs in utils**: A function that can run without React, browser events, Zustand, or network access belongs in `utils/`.
- **Side effects belong in services**: HTTP calls, chain calls, SDK execution, local storage adapters, and long-running async flows belong in `src/services/` or a feature service file if truly feature-local.
- **Types belong near the domain**: Shared feature models belong in `types.ts`; component-only prop types may stay in the component file.
- **Constants belong in constants files**: ABI presets, option lists, default data, and static configuration should not be recreated inside components.

### 4. Clean File Standards

- A single source code file must not exceed 400 lines. Split files that approach this limit into focused components, hooks, utilities, services, types, or constants according to their responsibilities.
- Keep imports intentional. Remove unused imports immediately.
- Prefer named, narrow components over long inline JSX blocks.
- Prefer explicit props over reaching into global stores from deep child components, unless the component is intentionally store-connected.
- Avoid deeply nested conditionals in JSX. Extract a component, helper, or early return when readability drops.
- Avoid duplicating UI action lists. If click menus and context menus share actions, render them from the same helper or component.
- Keep comments sparse and useful. Comments should explain non-obvious intent, not restate code.
- Avoid broad refactors in unrelated files. Keep changes scoped to the feature or behavior being edited.

### 5. Shared State & Service Placements
- **Zustand Stores**: Shared state that needs local storage persistence or global cross-feature visibility must be written inside `src/store/`.
- **RPC Endpoint State**: User-managed RPC endpoints must be stored in `src/store/rpc/useRpcStore.ts`. Default RPC entries are static feature constants and must remain non-deletable.
- **Service Layers**: Non-UI side-effects, dynamic SDK integrations (like Viem/Wagmi read/write handlers), or network requests must be encapsulated inside `src/services/` rather than embedded in page hooks.
- **HTTP API Calls**: All `fetch`-based API calls must live under `src/services/api/`. Do not add direct `fetch` calls inside feature components, hooks, stores, or page files.
- **API Organization**: Put each external API domain or product capability in a focused client file such as `contractExplorerApi.ts` or `restApi.ts`. Reuse shared request helpers from `httpClient.ts` instead of duplicating response parsing, query building, or CORS fallback logic.
- **Base URLs**: Add shared or per-service base URLs to `src/services/api/config.ts` using named constants. API clients with the same base URL must reference the same config entry; API clients with different base URLs should add a separate named config entry.
- **CORS Proxy Fallback**: Use the shared API client option for proxy fallback only when a browser request is blocked before receiving a response. Do not route every request through the proxy by default.
- **API Exports**: Export new API clients from `src/services/api/index.ts` and import them through the API barrel where practical.

### 6. Deprecated API Avoidance

Avoid deprecated functions, hooks, props, and package APIs whenever possible.

- Check TypeScript, editor diagnostics, package docs, and build warnings before using an unfamiliar API.
- Prefer current React patterns: function components, hooks, controlled inputs, and `createRoot`-based rendering.
- Prefer current library APIs over compatibility aliases or deprecated props.
- Do not introduce new deprecated APIs to match old local code. If existing code uses a deprecated API and the current task touches that code path, update it when the change is low risk.
- If a deprecated API cannot be avoided because of package constraints, leave a short comment explaining why and keep the usage isolated.

### 7. Asset Placement

Keep static assets organized by type:

- Images must live in `src/assets/images/`.
- SVG files and reusable SVG icon components must live in `src/assets/svgs/`.
- Each reusable SVG icon component must live in its own file named after the component, such as `PlusIcon.tsx`, and be exported from `src/assets/svgs/index.ts`.
- When fixing or generating SVG icon components, follow the existing reusable icon pattern used by `PlusIcon` and `TrashIcon`: use `SvgIconProps`, call `iconProps(title)`, include a `<title>{title}</title>`, set `fill="none"` for stroked icons, use `currentColor` for strokes, apply `strokeLinecap="round"`, `strokeLinejoin="round"`, `strokeWidth={props.strokeWidth ?? 2}`, and `vectorEffect="non-scaling-stroke"` on stroked paths. At usage sites, pass a meaningful `title` and size icons with explicit classes such as `h-4 w-4 shrink-0`.
- Other asset files must live directly under `src/assets/` or an appropriately named subfolder when the type needs grouping.
- Do not define SVG icon markup inline in feature, route, layout, or UI components. Import SVG icon components from `src/assets/svgs/`, and pass the icon title as a prop at the usage site.

---

## 🎨 Styling & Component Rules

1. **Adhere to the Flamingo Design System**:
   - Always import buttons, inputs, selects, overlays, dialogs, and progress bars from `src/components` (barrel export).
   - Never write raw buttons or style with arbitrary colors (e.g. `bg-red-500` or `#ff0000`). Use theme tokens (e.g. `bg-primary-500` or `text-foreground`).
2. **React Key Usage**:
   - Do not use array indexes (`key={idx}`) for dynamic lists. Use unique identifiers (like `inputName` or item IDs).
   - If no unique keys exist, generate a stable ID at list instantiation or use a `// biome-ignore lint/suspicious/noArrayIndexKey` comment with a clear rationale.
3. **Confirm Destructive Delete/Remove Actions**:
   - When implementing any user-facing delete or remove action, show a confirmation dialog before permanently deleting data or removing user-created content.
   - The confirmation should name the item when possible, explain the consequence, and require an explicit confirm action before calling the destructive handler.
4. **Workspace Environment-Aware Text Fields**:
   - In workspace request tabs, all text inputs and textareas that accept request data must use the environment-aware field components that support `{{variable}}` placeholders, such as `EnvironmentAwareInput` and `EnvironmentAwareTextarea`.
   - This applies to target URLs or contract addresses, query parameters, headers, request bodies, and contract arguments.
   - Use the base shared `Input` and `Textarea` only for fields that do not accept environment placeholders, such as request names, ABI JSON, search inputs, environment variable definitions, and dialog labels.

---

## 🚨 TypeScript and Biome Rules

- **Zero "any" Types**: Explicit `any` declarations are forbidden. Use strict types, generic parameters, or `unknown` for dynamic payloads.
- **Auto-Formatting**: Run `bun run lint:fix` to check compliance before completing a task.

---

## ✅ Unit Test Rules

- Every code task must add or update unit tests for the behavior being changed.
- Unit tests must live in a `test/` folder at the same directory level as the source code under test.
- Name test files after the source file they cover, such as `responsePayload.test.ts` for `responsePayload.ts`.
- Run `bun run test` for unit tests before finishing, or explain why a task cannot be unit tested.
