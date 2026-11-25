# Resizable request and response panels

Drag the divider between Request settings and Response & Logs to give either panel more room. Widths change while dragging; releasing saves the split. A cancelled drag restores the previous split.

Use **Reset panel widths** to return to an equal split. Focus the divider and use Left/Right Arrow for 2 percentage-point adjustments, Shift+Arrow for 10, Home/End for the limits, or Enter to reset. Other application shortcuts keep their normal behavior.

Each panel keeps at least 320 CSS pixels. Side-by-side layout requires a viewport of at least 1024px and 664px available for the panels and 24px divider. Otherwise panels stack, and horizontal resize controls are hidden. When a focused resizing control disappears, focus moves to Request settings without scrolling. Response header actions wrap so Logs and Copy remain reachable.

## Preference and data safety

One personal layout is shared across requests, collections and workspaces and restored after browser reloads or desktop restarts within the same profile/installation. It is stored as a numeric request-panel share under localStorage key `fetchx-request-panel-ratio`.

The preferred ratio is separate from temporary width constraints. Narrowing the window or opening neighboring panels never replaces it. A divider click without adjustment, a drag back to the start, or pushing against an existing bound does not overwrite it. Completed adjustments and keyboard/reset actions save; pointer movements do not write storage.

Missing or corrupt storage defaults to an equal split. If storage is unavailable, adjustments remain in memory for the running session. No backend request or sync operation is used.

Resizing preserves request contents, unsaved edits, selected tabs, responses/logs and running execution. Layout is not included in request or collection exports, request dirty tracking, or GitHub synchronization.

## Implementation

- [Split view](../../../src/features/workspace/components/request/RequestResponseSplit.tsx) keeps both panel subtrees mounted in both layouts.
- [Resize hook](../../../src/features/workspace/hooks/useRequestPanelResize.ts) measures the container and handles focus/keyboard input.
- [Pointer session](../../../src/features/workspace/hooks/requestPanelDrag.ts) owns capture, preview, commit/cancellation and cursor/selection cleanup.
- [Geometry helpers](../../../src/features/workspace/utils/requestPanelLayout.ts) enforce fit, bounds and keyboard increments.
- [UI preference store](../../../src/store/layout/useRequestPanelLayoutStore.ts) and [safe storage adapter](../../../src/services/preferences/requestPanelPreferences.ts) keep the preference separate from workspace data.

No new dependency, environment variable, native capability, API, or migration is required. Web and desktop consume the same frontend code.

## Validation

Run convention audit, Bun tests, lint and production build from the client root. Automated tests cover geometry, pointer lifecycle, keyboard calculations, storage failures, rendered semantics and request/export/sync isolation. Browser/manual and native runtime verification are not part of the automated checks.
