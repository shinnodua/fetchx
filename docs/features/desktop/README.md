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

## Extension rules

- Keep web and desktop behavior separated at the platform service boundary.
- Do not add Tauri-specific imports to workspace components unless they are abstracted behind `src/services/platform`.
- Keep Cloudflare web hosting and desktop update/download hosting as separate concerns.
- Prefer local-first runnable release helpers and explicit per-OS commands when adding release workflow docs or scripts.
