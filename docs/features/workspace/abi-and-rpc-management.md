# ABI And RPC Management

ABI and RPC management support contract request authoring and execution.

## Built-in networks and RPCs

Built-in network metadata lives in `src/features/workspace/constants.ts`.

Default RPC entries are static feature constants. User-created RPCs are stored separately in `useRpcStore` and combined through utilities such as `getSelectedRpcId`.

## Custom RPC store

`src/store/rpc/useRpcStore.ts` persists under:

```text
call3-rpc-storage
```

It stores:

- `customRpcs`;
- `manageRpcOpen`.

Adding a custom RPC trims name, chain id, URL, and optional explorer URL. Empty names become `Custom RPC`.

Deleting a custom RPC removes it by id.

## RPC selection

Contract request types render `RpcSelectField`.

When the selected network/RPC changes, the active draft is updated with fields such as:

- `network`;
- `customRpcId`;
- related RPC metadata used by public client selection.

`useWorkspacePublicClient` uses the active request selection to build or choose the viem public client used by reads, simulations, and receipt tracking.

## Saved ABI store

`src/store/abi/useAbiStore.ts` persists under:

```text
call3-abi-storage
```

It stores:

- `savedAbis`;
- `manageAbiOpen`.

Saving an ABI with an existing case-insensitive name updates the existing entry. Otherwise it creates a new saved ABI.

## ABI forms

Contract request settings include ABI controls for:

- manual ABI paste;
- selected function;
- ABI argument fields;
- saving ABI to the local ABI library;
- managing saved ABIs.

ABI JSON and human-readable ABI parsing should go through `parseContractAbi`.

## Auto-loading ABI

`useAutoLoadAbi(activeRequest, activeTabId)` watches the active contract request target and network.

It only attempts auto-load when:

- the active request target changes after the first observed value;
- Call3 API is configured;
- request type is `READ` or `WRITE`;
- the resolved target is a valid `0x` address;
- the same tab/address/network combination has not already been attempted.

The hook resolves environment variables in the target before validating the address.

On success:

- `abi` is updated with returned ABI JSON;
- `contractName` is set;
- request name is updated only when it is still `Untitled Request`;
- a success toast is shown.

On not found:

- a warning toast tells the user to paste ABI manually.

On error:

- the error is logged to the console;
- the UI does not show a noisy failure toast.

## Call3 service clients

Contract info import uses `src/services/api/contractExplorerApi.ts`.

Bytecode ABI inference uses `src/services/api/bytecodeAbiApi.ts`.

Both clients:

- build URLs through `buildCall3ApiUrl`;
- fail clearly when `VITE_API_URL_CALL3` is not configured;
- send `ai: true` in the request body;
- normalize backend error messages with `getApiErrorMessage`.

Keep future Call3-backed ABI behavior in `src/services/api/*` so components and hooks do not own raw fetch calls.
