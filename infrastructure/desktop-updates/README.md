# Call3 desktop update service

This Worker serves Tauri 2 update metadata while release artifacts remain in
the `call3-desktop-releases` R2 bucket.

## Cloudflare resources

1. Create the `call3-desktop-releases` R2 bucket.
2. Connect `downloads.call3.dev` as its public custom domain.
3. Deploy this Worker with `bun run desktop:updates:deploy`.
4. Confirm `https://updates.call3.dev/health` returns `{ "status": "ok" }`.

The bucket stores immutable artifacts under `desktop/stable/<version>/` and
the active release manifest at `channels/stable.json`. Publish the manifest
only after every artifact has uploaded successfully.

The Worker does not hold signing keys. It returns signatures generated during
the native build, and the public key embedded in the app verifies them.
