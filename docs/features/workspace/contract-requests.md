# Contract Requests

Contract request types cover EVM interactions:

- `READ`: read-only contract calls.
- `WRITE`: wallet-signed contract writes.
- `SEND`: native token transfers.

## Shared fields

Contract requests use these `RequestItem` fields:

- `target`: contract address for `READ` and `WRITE`, recipient address for `SEND`.
- `network`: selected chain id as a string.
- `customRpcId`: optional selected custom RPC id.
- `abi`: contract ABI as JSON or human-readable signatures.
- `functionName`: selected contract function.
- `args`: string values keyed by ABI input name or fallback argument key.
- `contractName`: imported or auto-loaded contract name.
- `response`: latest response.
- `savedResponses`: saved response snapshots.

## Public client selection

`useWorkspacePublicClient(activeRequest)` selects the viem public client for the active request. It considers the selected network and custom RPC metadata.

Read calls, simulations, and transaction receipt tracking require a public client. If one is unavailable, execution throws a clear "Public client not available" error.

## ABI parsing

`parseContractAbi` accepts ABI JSON and human-readable ABI signatures. It is the shared ABI parser used by UI and runtime execution.

Before execution, `useRunContractRequest`:

1. parses the ABI;
2. finds the selected function by name;
3. formats argument strings through `formatContractArgs`;
4. logs the target, function, argument values, and network using redacted request data.

## READ execution

READ calls execute through:

```text
useRunContractRequest.runContractRequest
  -> requestExecutor.executeReadCall
  -> publicClient.request({ method: "eth_call" })
```

`executeReadCall` encodes the function call with viem, performs a raw `eth_call`, then attempts to decode the result.

If decode succeeds, the response contains decoded data. If decode fails, the response still succeeds with raw hex data and includes a decode warning. This preserves useful output for contracts or ABI inputs that return data the decoder cannot fully interpret.

BigInt values are serialized before storing in response state.

## WRITE execution

WRITE calls require a connected wallet. If no wallet is connected, `ActiveRequestWorkspace` shows a connect action and `useRunContractRequest` can open the connect modal before throwing a wallet-not-connected error.

Before writing, `ensureSelectedWalletNetwork` checks the connected wallet chain. If the selected network differs, it calls `switchChainAsync`. If the chain is not configured, execution stops with a configured-network error.

Execution path:

```text
useRunContractRequest.runContractRequest
  -> requestExecutor.executeWriteCall
  -> writeContractAsync
  -> publicClient.waitForTransactionReceipt
```

If a public client is available, the response waits for confirmation and includes receipt data. If not, the response can still record the transaction hash as `Sent`.

## WRITE simulation

Simulation is available for `WRITE` requests. It does not send a transaction.

Execution path:

```text
useRequestRunner.handleSimulateRequest
  -> useRunContractRequest.simulateContractRequest
  -> requestExecutor.executeSimulateCall
  -> publicClient.simulateContract
```

If a wallet address is connected, simulation uses it as the account. If no wallet is connected, logs note that simulation is running with the default sender.

The response status is `Success` when simulation completes. If the simulation returns no data, the response uses a success marker.

## SEND execution

SEND transfers native tokens from the connected wallet to the target address.

Validation rules:

- target must be a valid `0x` address;
- wallet must be connected;
- selected network must be available in wallet configuration;
- `args.nativeAmount` must parse with `parseEther`;
- amount must be greater than zero.

Execution path:

```text
useRunContractRequest.runContractRequest
  -> requestExecutor.executeNativeTransfer
  -> sendTransactionAsync
  -> publicClient.waitForTransactionReceipt
```

The response includes transaction hash, amount, recipient, and receipt details when available.

## Sensitive values

Contract targets and arguments can reference environment variables. Sensitive values are resolved only for execution and redacted in logs and responses.

Locked sensitive variables block execution until the user unlocks them with the pincode dialog.
