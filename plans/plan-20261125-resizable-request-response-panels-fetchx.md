# Implementation Plan: Resizable request and response panels — Fetchx

## Metadata
- Plan ID: `PLAN-20261125-resizable-request-response-panels-fetchx`
- Parent plan ID: `PLAN-20261125-resizable-request-response-panels`
- PRD ID: `PRD-20261125-resizable-request-response-panels`
- Type: `plan`
- Status: `complete`
- Created: `2026-11-25`
- Last updated: `2026-11-25`
- Owner: `frontend-developer`
- Research sources:
  - [RESEARCH-20261125-resizable-request-response-panels](../../../research/research-20261125-resizable-request-response-panels.md) — ownership, state isolation and validation.
- Related artifact IDs: `[DESIGN-20261125-resizable-request-response-panels]`
- PRD link: [Approved requirements](../../../prds/prd-20261125-resizable-request-response-panels.md)
- Author: delegated fetchx_plan agent; coordinator saved after worker filesystem approval timed out.

## Title
Resizable request and response panels — Fetchx web and desktop

## Parent Overview Plan
[Parent plan](../../../plans/plan-20261125-resizable-request-response-panels.md)

## Platform Responsibility
Implement in shared React frontend for web and Tauri desktop, serially because both use the same files.

## Research Inputs
- [Reviewed research](../../../research/research-20261125-resizable-request-response-panels.md).
- [Canonical design](../designs/design-20261125-resizable-request-response-panels.md).
- Open Design Cloud project: fetchx-resizable-request-and-response-panels-3a00; artifacts resizable-panels.md and panel-resize-wireframe.html. Markdown governs behavior.
- ActiveRequestWorkspace owns the lower panel layout; both roots impose lg:w-1/2.
- ResponsePane header/actions can clip at minimum width.
- Shared personal state belongs in src/store independently of request and collection models.
- Installed React/Zustand/Bun/server rendering suffice; no new dependency.
- Source gap: browser/native interaction and visual fit remain unverified under AGENTS instructions.

## Local Scope
In scope: split view, geometry, interaction hook/controller, safe preference persistence, keyboard/reset, measurement/focus recovery, stable children, header wrapping, automated tests, documentation.
Out of scope: APIs, backend, collection schemas, native shell, new packages, collapse/reorder/detach, vertical resizing and cross-device sync.

## Files And Areas To Inspect
- src/features/workspace/components/request/ActiveRequestWorkspace.tsx
- src/features/workspace/components/request/settings/RequestSettings.tsx
- src/features/workspace/components/request/response/ResponsePane.tsx
- src/features/workspace/hooks/ and utils/
- utils/requestDirty.ts, requestExport.ts, workspaceRepositoryFormat.ts
- src/store/, src/services/, components/ui/Button.tsx and barrel/theme
- docs/features/workspace/, docs/stores/README.md, docs/README.md
- AGENTS.md and relevant .agent/skills/

## Expected Code Changes

### Geometry
Pure requestPanelLayout helpers: default .5; minimum 320px; divider 24px; side by side only with viewport>=1024 and container>=664. Usable panel width P=container-24. Clamp effective share to [320/P,1-320/P]. Stack with existing 16px gap otherwise. Valid preferred ratio is finite and strictly between 0 and 1; invalid defaults .5. Keep preferred and effective ratios separate. Arrow keys change .02, Shift arrows .10, Home/End bounds, Enter reset; ignore unrelated keys and Control/Meta/Alt combinations. Measurements never save preferences.

### Preference state and persistence
Focused Zustand UI-layout store under src/store with independent storage key. Exception-safe adapter under src/services handles absent globals, blocked storage access, malformed values and write failures; retain changes in memory. Persist completed moved drags and keyboard/reset actions only. No request/collection/export/sync changes or pointermove storage writes.

### View and responsive lifecycle
Feature-local RequestResponseSplit wraps current panels inside ActiveRequestWorkspace. Stable wrappers, child order and mounted trees across layout changes. Keep request toolbar above split. Remove lg:w-1/2; ensure min-w-0. ResizeObserver plus viewport resize/matchMedia; no SSR browser-global access. Named full-height 24px vertical separator exposes current/min/max and percentage value text, associated keyboard instructions. Flamingo rule/grip and hover/active/focus tokens; no animated widths. Shared Button for visible Reset panel widths. Hide separator/reset from focus order when stacked; focus stable Request settings region with preventScroll if focused resize controls disappear. Wrap response header/action group. Preserve existing content states/logs dialog.

### Pointer interaction
Focused hook/controller with testable session seam. Track pointer ID, initial X, initial effective ratio, transient preview. Primary pointer/button only; ignore other IDs/repeated starts. Capture pointer and apply X delta to initial width (no jump). Continuous preview, process final pointerup coordinates, commit actual adjustment only. No-op, bound-pushing without adjustment, or returning to start preserves prior preferred ratio. Cancel on pointercancel, unexpected lost capture, blur, stacking or unmount; discard preview. Clear session before releasing capture. Restore prior cursor/selection and remove listeners on every exit. Keyboard/reset cancel active preview before applying adjustments.

## Implementation Steps
1. Confirm parent approval before code; preserve existing user changes.
2. Implement geometry/keyboard helpers with adjacent tests.
3. Implement isolated storage/store and persistence tests.
4. Implement session/controller and hook with explicit commit/cancel, measurement, cleanup and focus handoff.
5. Integrate stable split and wrap response actions.
6. Test meaningful session/controller and rendered markup behavior without adding a DOM package.
7. Isolation regression: drag commit, keyboard and reset preserve dirty state, request/collection exports, response/log data and sync digest.
8. Document controls, persistence key/scope, responsive fallback; link feature and store indexes. Coordinator adds corresponding root docs/fetchx mappings.
9. Run module checks and root validation; inspect formatter scope.
10. Return verified auto-mode completion facts; no commits, pushes or deploys.

## Dependencies
Existing React, Zustand, TypeScript, Tailwind/Flamingo, Bun, browser/WebView pointer/resize APIs. No backend endpoint, package, native capability, shared contract or migration. User confirmed shared persistence and full auto-mode continuation. Parent plan approval required. Backend/collections unaffected.

## Validation Commands
From modules/fetchx:
~~~sh
bun run convention:check --strict
bun run test
bun run lint:fix
bun run lint
bun run build
~~~
Root:
~~~sh
bun run workspace:check
~~~
Cover exact 664/1024 fit and one-pixel-below thresholds; direction/grab offset/bounds/pointer rejection/final release/no-op/cancel/cleanup/late events; keyboard steps and ignored modifiers; preferred ratio recovery; valid/absent/malformed/throwing storage; accessible markup/reset/stacked controls/stable structure/wrapped actions; request/export/sync/dirty isolation.
No unsolicited manual/browser or native runtime checks; report limits.

## Risks
- Automated checks cannot establish actual browser/native visual usability.
- Remounting can reset editors; stable identity required.
- Saving clamped/no-op values can erase preference.
- Late capture events can duplicate commits; finish idempotently.
- Long response actions need wrapping and overflow handling.
- Whole-repo formatting may touch unrelated changes; preserve them.
- Read-only filesystem requires approved writes/builds.

## Open Questions
None.

## Approval
- Approved by: auto-mode (developer-enabled)
- Approved on: 2026-11-25
- Approval command: `$auto-mode on`

## Completion
Implemented and validated: convention audit, 419 unit tests, lint and production web build passed. Browser/native runtime checks were not run per repository instructions. See [completion handoff](../../../docs/fetchx/resizable-panels-handoff.md).
