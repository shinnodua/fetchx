# Design System Showcase Feature

The design system feature is a product-facing showcase of the shared Flamingo UI components and theme tokens.

## Source map

- `src/features/design-system/DesignSystemPage.tsx`
- `src/features/design-system/components/ColorPalette.tsx`
- `src/features/design-system/components/ComponentShowcase.tsx`
- `src/features/design-system/components/TypographyDemo.tsx`
- `src/routes/design-system.tsx`
- `src/components/`
- `src/index.css`

## Responsibilities

This feature demonstrates:

- theme color usage;
- typography scale;
- shared UI component variants;
- component state examples.

## Compact density

Shared UI primitives use a compact default density so workspace screens can show
more request, response, and configuration information at once. Buttons, fields,
tabs, cards, dialogs, menus, tables, and form controls use smaller default text,
heights, and internal spacing. Feature code may provide a larger class only when
the task requires a deliberately prominent action or readable long-form content.
Header action controls retain a small bottom margin to keep visual separation
from the header boundary.

Inline field-and-action rows use matching density variants. Compact rows pair
`Input density="sm"` with `Button size="sm"`; feature code should not use one-off
height utilities to force controls into alignment.

It should not become the source implementation of shared UI primitives. Shared UI primitives belong in `src/components/ui/` and are exported through `src/components/index.ts`.

## Route boundary

`src/routes/design-system.tsx` should remain a thin route wrapper that renders the feature page.

## Extension rules

- Import shared UI components from `src/components`.
- Use theme variables and established component variants.
- Avoid arbitrary hex colors or one-off Tailwind color classes.
- Keep examples realistic enough to catch component regressions.
