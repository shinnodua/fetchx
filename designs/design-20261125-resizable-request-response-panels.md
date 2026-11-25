# Resizable request workspace — design handoff
- Design ID: DESIGN-20261125-resizable-request-response-panels
- Status: complete
- Owner: fetchx
- PRD: PRD-20261125-resizable-request-response-panels
## Summary and users
REST and Web3 developers drag a vertical divider to prioritize editing or response inspection. Keep current hierarchy, typography, panel cards, and request toolbar.
## Layout and responsive behavior
Default 50/50 split. Side-by-side only at the existing lg viewport breakpoint (1024px) AND with at least 664px of panel-area width: 320px each panel plus 24px divider gap. Otherwise stack exactly as today, with 16px vertical gap; remove divider and reset control from focus order. Remember the preferred ratio while temporarily constraining it. Returning to sufficient room restores that ratio within the current limits.
## Components and visual direction
Use Flamingo foreground/background and primary-500 tokens. Between panel cards use a 24px-wide full-height separator target with a subtle centered 2px rule and small vertical grip. Hover, drag and focus highlight in primary color. No layout animation while dragging. Current card radius and backgrounds stay. Keep all toolbar controls above the split.
Provide a compact Flamingo ghost Button labelled "Reset panel widths" in a right-aligned utility row above the two panels, only in side-by-side layout. Clicking or keyboard activating it restores 50/50 and saves it.
## Interaction
Pointer drag changes widths immediately, preserving the grab offset. Capture the primary pointer; release anywhere ends dragging. Ignore secondary buttons/pointers. Pointer cancellation, lost capture, window blur, component cleanup and transition to stacked layout end dragging, restoring cursor and text selection. Keep both panels mounted throughout resizing and responsive transitions.
Focusable vertical separator name: "Request and response panel widths". Left/Right change request share by 2 percentage points; Shift+Arrow by 10. Home/End set the current min/max. Enter resets 50/50; title and associated accessible instructions describe controls. Expose current request percentage, min/max and a value text such as "Request 60%, response 40%".
## Persistence and states
One shared local preference across requests, collections, workspaces and restarts. Save completed drags and keyboard/reset adjustments; do not write storage on every pointer move. Invalid or blocked storage defaults safely to equal split without preventing live resizing. Persist preferred ratio, not a ratio temporarily clamped by available width.
Same behavior for empty, loading, success and failure content. Keep edits, active execution, tabs and contents intact. Scroll pane contents rather than the whole split; allow long output to scroll horizontally.
## Accessibility
Visible focus ring; generous full-height pointer target; pointer-independent reset. Hidden controls absent from tab order in stacked layout. No motion needed; respect reduced motion. Preserve normal text selection outside active drag. Controls remain reachable at min widths via wrapping/scrolling.
## Validation
Automated tests cover bounds, responsive fit, pointer/keyboard lifecycle, persistence failures and preference recovery. Follow repository automated validation commands. Browser/manual verification is excluded by repository instructions unless the user requests it.
## Open questions
None. Minimums are conservative starting values based on existing forms and headers; responsive stacking protects constrained layouts.

## Sprint review refinements
No-op pointer press/release retains preferred ratio under temporary clamping. Cancel, lost capture, blur, stacked transition or unmount discard transient widths; only completed moved drags commit. Keep in-memory preference if storage fails. Wrap response header/actions. If focused resizing controls disappear, focus the stable Request settings region with preventScroll. All five roles accepted these changes; no open questions.

- Root reference: [Workspace design](../../../designs/design-20261125-resizable-request-response-panels.md)
- Open Design Cloud project locator: fetchx-resizable-request-and-response-panels-3a00; artifact: resizable-panels.md

- Visual wireframe: Open Design Cloud project fetchx-resizable-request-and-response-panels-3a00, panel-resize-wireframe.html.
