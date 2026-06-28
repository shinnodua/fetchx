# Environments

Environments let users define variables and reference them in workspace request fields with `{{variableName}}`.

## Source map

- `src/store/environment/useEnvironmentStore.ts`: persisted environment state, active environment, sensitive pincode config, lock/unlock state.
- `src/features/workspace/utils/environment.ts`: variable resolution and redaction.
- `src/features/workspace/utils/sensitiveCrypto.ts`: pincode validation, key derivation, encryption, and decryption.
- `src/features/workspace/components/environment/`: environment selector, dialog, variable table, pincode panel, unlock dialog, and environment-aware fields.

## Variable model

Each `EnvironmentVariable` has:

- `id`: stable UI/store id;
- `key`: placeholder name used inside `{{key}}`;
- `value`: plaintext value when non-sensitive or unlocked;
- `enabled`: disabled variables are ignored during resolution;
- `sensitive`: marks values that must be encrypted and redacted;
- `encryptedValue`: encrypted payload for sensitive values.

## Resolution

`resolveVariables(text, variables)` returns both:

- `value`: text with enabled variables replaced by plaintext values;
- `redacted`: text with sensitive variables replaced by `[REDACTED]`.

Variable keys are escaped before building the placeholder regex, so special characters in keys do not break matching.

`replaceVariables` is a convenience wrapper that returns only `value`.

## Execution preparation

`useRequestRunner` resolves all request execution inputs:

- target;
- body;
- header keys and values;
- query parameter keys and values;
- contract argument values.

The resolved request is sent to execution services. The redacted request is used for logs and UI-safe messages.

## Locked sensitive values

Sensitive values are stored without plaintext after reload or after locking. When a request references a sensitive variable whose value is not currently available in memory, `getLockedSensitiveVariableNames` returns that variable name.

Execution stops and opens `UnlockSensitiveDialog` when locked sensitive variables are referenced.

## Sensitive value encryption

Sensitive encryption is owned by `useEnvironmentStore` and `sensitiveCrypto.ts`.

When the user sets or unlocks a pincode:

1. the pincode is validated against the minimum length;
2. a Web Crypto key is derived using the stored crypto config;
3. sensitive plaintext values are encrypted;
4. encrypted values are persisted;
5. plaintext values remain available only in memory while unlocked.

On lock:

- the in-memory crypto key is cleared;
- sensitive plaintext values are stripped from environments;
- encrypted payloads remain persisted.

On rehydrate:

- the crypto key is cleared;
- `sensitiveUnlocked` is reset to `false`;
- plaintext sensitive values stay stripped.

## Redaction

`redactSensitiveValues(text, variables)` replaces active sensitive values in text with `[REDACTED]`.

It checks several variants of a sensitive value:

- raw value;
- URL-encoded value;
- URL-encoded value with spaces as plus signs;
- URI-encoded value;
- base64-encoded value.

`redactSensitiveData(data, variables)` recursively redacts strings inside arrays and objects.

## UI requirements

Workspace request data fields that accept request data should use environment-aware fields:

- target URL/address;
- headers;
- query parameters;
- request body;
- contract arguments.

Use normal `Input` or `Textarea` only for fields that should not resolve placeholders, such as request names, ABI JSON, search inputs, dialog labels, and environment variable definitions.
