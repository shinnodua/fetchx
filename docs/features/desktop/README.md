# Desktop Feature

The desktop feature contains UI behavior that only exists for the Tauri desktop wrapper.

## Source map

- `src/features/desktop/components/DesktopUpdateManager.tsx`
- `src/features/desktop/components/DesktopCloseGuard.tsx`
- `src/features/desktop/components/index.ts`
- `src/services/platform/`
- `src/services/api/desktopReleaseApi.ts`

## Responsibilities

The desktop feature owns desktop-specific presentation and user flows:

- checking for available desktop updates;
- surfacing update status;
- handling desktop close protection where needed;
- delegating platform detection, updater actions, relaunch behavior, and native file/window operations to `src/services/platform`.

## Service boundary

Desktop-specific side effects should stay centralized in `src/services/platform/`. Feature components should call platform service functions instead of scattering Tauri checks throughout the workspace or shared UI.

Desktop release/download API calls should stay in `src/services/api/desktopReleaseApi.ts`.

Browser download prompts are shown by detected desktop OS only. The macOS
download prompt must not be shown on iPhone or iPad browsers, including iPadOS
desktop-mode browsers that report a Macintosh-like user agent.

## Update verification

Desktop updates use Tauri 2 updater signatures. The backend can announce an
available version, but the installed app trusts an update only after
`@tauri-apps/plugin-updater` verifies the downloaded artifact with the public
key embedded in `src-tauri/tauri.conf.json`.

Release scripts enforce the required trust boundary:

- `TAURI_SIGNING_PRIVATE_KEY` is required for release builds;
- `plugins.updater.pubkey` must be a real base64-encoded minisign public key;
- collected updater artifacts must have matching `.sig` files;
- collected fragments include SHA-256 metadata for release auditing;
- `channels/stable.json` is published only after all immutable artifacts are
  uploaded.

The Cloudflare Worker and R2 bucket do not hold signing keys. Treat them as an
untrusted distribution path that the client verifies cryptographically before
installation.

macOS releases should also be signed with Developer ID and notarized. Windows
installers should be signed with Authenticode. Those OS signatures complement
the Tauri updater signature; they do not replace it.

## Extension rules

- Keep web and desktop behavior separated at the platform service boundary.
- Do not add Tauri-specific imports to workspace components unless they are abstracted behind `src/services/platform`.
- Keep Cloudflare web hosting and desktop update/download hosting as separate concerns.
- Prefer local-first runnable release helpers and explicit per-OS commands when adding release workflow docs or scripts.
