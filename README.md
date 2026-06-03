# Call3.dev

Call3.dev is an interactive Web3 and REST API client for organizing, editing, and running reusable requests. It combines a collection-based workspace with contract read/write calls, HTTP request testing, cURL import, tabbed editing, and persistent local drafts.

## Purpose

Call3.dev is built for developers who need one focused workspace to:

- Run smart contract read and write calls through a connected wallet.
- Test REST endpoints with query parameters, headers, and JSON bodies.
- Import requests from cURL commands or JSON request definitions.
- Organize contract and API calls into collections.
- Work across multiple request tabs with save, duplicate, rename, close, and reveal workflows.

## Core Features

- **Collections Workspace**: Create, rename, duplicate, delete, search, collapse, and resize request collections.
- **Request Tabs**: Open multiple requests, drag tabs to reorder them, right-click tabs for close/reveal actions, and keep active tabs visible.
- **Web3 Contract Calls**: Execute read and write contract functions using ABI input, network selection, Wagmi, Viem, and RainbowKit wallet connection.
- **REST Request Client**: Configure GET/POST requests with query parameters, headers, JSON body editing, and response/log output.
- **Import Workflows**: Import full requests from the import dialog or paste cURL directly into the URL input.
- **Request Editing Tools**: Inline request naming, body JSON beautify, dirty-tab tracking, draft saving, and discard confirmation.
- **Persistent Workspace State**: Collections, tabs, drafts, panel state, and theme settings are managed with Zustand.
- **Flamingo Design System**: Custom UI components, theme tokens, dark mode support, and Biome-enforced formatting.

## Tech Stack

- React 19 + TypeScript + Vite
- TanStack Router
- Zustand
- Tailwind CSS v4
- Wagmi + Viem + RainbowKit
- Framer Motion
- Biome
- Wrangler for preview/deploy workflows

## Getting Started

1. Install dependencies:

   ```bash
   bun install
   ```

2. Start the development server:

   ```bash
   bun run dev
   ```

3. Check and fix formatting/linting:

   ```bash
   bun run lint
   bun run lint:fix
   ```

4. Build for production:

   ```bash
   bun run build
   ```

## Useful Scripts

- `bun run dev`: Start the local Vite development server.
- `bun run lint`: Run Biome checks.
- `bun run lint:fix`: Auto-fix Biome formatting and lint issues.
- `bun run build`: Type-check and build the production bundle.
- `bun run preview`: Build and preview with Wrangler.
- `bun run deploy`: Build and deploy with Wrangler.

## Project Structure

```text
src/
├── components/              # Shared Flamingo UI components
├── features/
│   ├── workspace/           # Main request workspace feature
│   │   ├── components/      # Workspace views and feature UI
│   │   ├── utils/           # Workspace-only pure helpers
│   │   ├── constants.ts     # ABIs, method options, networks, demo data
│   │   ├── types.ts         # Workspace domain types
│   │   └── WorkspacePage.tsx
│   └── design-system/       # Design system showcase
├── routes/                  # Thin TanStack Router wrappers
├── services/                # Request execution services
├── store/                   # Zustand stores
└── utils/                   # Shared cross-feature utilities
```
