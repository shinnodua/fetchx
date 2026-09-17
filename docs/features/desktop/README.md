# Desktop Feature

The desktop feature contains UI behavior that only exists for the Tauri desktop wrapper.

## Source map

- `src/features/desktop/components/DesktopUpdateManager.tsx`
- `src/features/desktop/components/index.ts`
- `src/services/platform/`
- `src/services/api/desktopReleaseApi.ts`

## Responsibilities

The desktop feature owns desktop-specific presentation and user flows:

- checking for available desktop updates;
- surfacing update status;
- delegating platform detection, updater actions, relaunch behavior, and native file/window operations to `src/services/platform`.

## Service boundary

Desktop-specific side effects should stay centralized in `src/services/platform/`. Feature components should call platform service functions instead of scattering Tauri checks throughout the workspace or shared UI.

Desktop release/download API calls should stay in `src/services/api/desktopReleaseApi.ts`.
Website download URLs must resolve to immutable
`https://downloads.fetchx.dev/desktop/stable/<version>/...` release artifacts.

The Tauri bundle identifier is `dev.fetchx.desktop` for FetchX desktop
releases.

Browser download prompts are shown by detected desktop OS only. The macOS
download prompt must not be shown on iPhone or iPad browsers, including iPadOS
desktop-mode browsers that report a Macintosh-like user agent.
Browser download actions open their tab synchronously with the user click, then
navigate it after the release URL resolves so popup blockers do not suppress
the download.
Footer desktop download actions should keep a comfortable press area so the
download button is easy to click on desktop and touch devices. The footer
should also stay on its own stacking layer so workspace overlays cannot cover
part of the download button. Empty fixed overlay viewports, such as the toast
viewport, must not intercept pointer events over footer actions.

Desktop window close is native. Do not intercept Tauri `onCloseRequested` for
unsaved-change prompts because it can prevent the window close button from
closing the app. Browser `beforeunload` unsaved-change prompts are not
registered inside the Tauri shell for the same reason.

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

When assembling a release manifest, only platform fragment files such as
`darwin-aarch64.json` and `windows-x86_64.json` are considered release inputs.
The fetched `existing-stable.json` manifest is used only to merge artifacts
from prior releases for platforms that have not been rebuilt yet; it is never
validated as a new artifact fragment. New platform artifacts take precedence
over retained entries.

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
