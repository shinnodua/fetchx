# Fetchx desktop update service (Legacy / Deprecated)

> [!NOTE]
> **Superseded**: Tauri 2 updater and web download lookups now directly consume
> `https://downloads.fetchx.dev/channels/stable.json` served by R2. This Worker
> is no longer needed in the release and update pipeline.

This Worker previously served dynamic Tauri 2 update metadata from
`channels/stable.json` stored in the `fetchx-desktop-releases` R2 bucket.

## Cloudflare resources (Historical)

1. Create the `fetchx-desktop-releases` R2 bucket.
2. Connect `downloads.fetchx.dev` as its public custom domain.
3. The bucket stores immutable artifacts under `desktop/stable/<version>/` and
   the active release manifest at `channels/stable.json`. Publish the manifest
   only after every artifact has uploaded successfully.

## Update trust model

The Worker and R2 bucket are distribution infrastructure, not the root of trust.
They do not hold signing keys and they do not make the final install decision.

The release build signs updater artifacts with `TAURI_SIGNING_PRIVATE_KEY`.
`src-tauri/tauri.conf.json` embeds the matching updater public key under
`plugins.updater.pubkey`. The installed Tauri app verifies downloaded updates
with that embedded public key before installing them.

The Worker only validates release metadata shape before returning it:

- the release is newer than the client version;
- the platform entry has a `https://downloads.fetchx.dev/` URL;
- the platform entry has a non-empty updater signature.

Even if a middle-man tampers with `stable.json` or replaces an artifact, the
client rejects the update unless the artifact matches the Tauri updater
signature.

## Release signing rules

- Keep `TAURI_SIGNING_PRIVATE_KEY` only on the release machine or CI secret
  store.
- Never add signing private keys to Cloudflare Worker secrets, R2, frontend
  code, or repository files.
- Keep artifacts immutable under `desktop/stable/<version>/`.
- Upload all versioned artifacts and `.sig` files first.
- Publish `channels/stable.json` last.
- If the updater signing key is compromised, generate a new key pair, rotate
  `plugins.updater.pubkey`, and ship a trusted installer through the normal OS
  distribution channel so users receive the new embedded public key.
