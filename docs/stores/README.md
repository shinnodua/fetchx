# Stores

Global shared state lives under `src/store/`.

## Store map

- `workspace/useWorkspaceStore.ts`: collections, requests, tabs, drafts, dialogs, sidebar state, responses.
- `environment/useEnvironmentStore.ts`: environments, active environment, sensitive-value crypto state.
- `rpc/useRpcStore.ts`: custom RPC endpoints and manage-RPC dialog state.
- `abi/useAbiStore.ts`: saved contract ABIs and manage-ABI dialog state.
- `cors/useCorsStore.ts`: origins known to be browser-blocked and eligible for direct-skip proxy retry.
- `assistant/useAiAssistantStore.ts`: selected local agent identifier.
- `assistant/useAiAssistantChatStore.ts`: persistent local AI assistant chat history.
- `index.ts`: store exports, shared store barrel, and persisted app-level UI state such as theme.

## Persistence keys

- App: `app-storage`
- Workspace: `fetchx-workspace-storage`
- Environment: `fetchx-environment-storage`
- RPC: `fetchx-rpc-storage`
- ABI: `fetchx-abi-storage`
- AI assistant: `fetchx-ai-assistant-storage`
- AI assistant chat: `fetchx-ai-assistant-chat-storage`

## App store

The app store owns the current light/dark theme. New installs default to the light theme, and explicit user theme choices are persisted under `app-storage`.

## Workspace store

The workspace store is split into action modules:

- collection actions;
- request actions;
- tab actions;
- draft actions;
- response actions;
- setters.

This keeps the persisted state contract in one store while avoiding a single oversized action file.

## Environment store

The environment store persists environment structure and encrypted sensitive values. Sensitive plaintext is stripped during persistence and rehydration.

The Web Crypto key is module-local memory, not persisted state.

## RPC and ABI stores

RPC and ABI stores are intentionally separate from workspace collections because they are reusable libraries for many requests.

Workspace requests should store references such as selected network, custom RPC id, ABI string, or contract name. They should not own the entire global RPC or saved ABI library.

## CORS store

The CORS store remembers origins that have already produced an explicit browser CORS/access-control block. The HTTP client can then skip repeating a known blocked direct request and go straight to the proxy path, while still applying sensitive proxy confirmation.
