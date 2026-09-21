# Skill: Design System Enforcement

This skill guides AI agents to correctly write UI code conforming to the Flamingo Design System, preventing hardcoded styles, and ensuring visual consistency.

---

## 🎨 Design System Overview

Our design system is configured inside:
- **Tailwind Config / Theme**: Under `@theme` in **[src/index.css](../../src/index.css)**.
- **Custom Components**: Located in **[src/components/ui/](../../src/components/ui)**.
- **Component Exports**: Shared globally via **[src/components/index.ts](../../src/components/index.ts)**.

---

## 🛠 Rules & Implementation

### 1. Never Use Raw HTML Elements for Interactive UI
Always prefer custom components over native HTML elements to ensure premium styling, animations, and behaviors (e.g. framer-motion loaders or triggers).

- ❌ **Avoid**: `<button className="...">Click</button>`
-  **Use**: `<Button variant="primary">Click</Button>`

### 2. Import from the Shared Barrel File
Do not import directly from `components/ui/Button` if you are working on app routes. Import from the unified barrel path:
```tsx
import { Button, Input, Card } from '../components';
```

### 3. Use Palette Color Tokens (Never Hardcode Colors)
Avoid standard Tailwind colors (like `bg-rose-500`, `text-teal-600`) or raw hex codes. Use the Flamingo primary/secondary palettes:
- **Primary (Flamingo Pink)**: `primary-50` to `primary-900`. Use classes like `bg-primary-500`, `text-primary-600`.
- **Secondary (Teal/Ocean)**: `secondary-50` to `secondary-900`. Use classes like `bg-secondary-500`, `text-secondary-600`.
- **Theme Variables**: Use `bg-background` and `text-foreground` to automatically adapt to light/dark themes.

### 4. Safe Color Swatch Usage
If you need to dynamically list color swatches, do not concatenate strings dynamically (e.g. `bg-primary-${step}`). Static compilers will miss them. Instead, use the defined mapping objects in `design-system.tsx`:
```tsx
// Correct usage via static lookup maps:
className={`${primaryBgClasses[step]}`}
```

### 5. Inline Action-Row Alignment

When a text field and button share one horizontal action row (for example,
creating a branch, adding a header, or entering a label), they must use the
same design-system density. Use `Input density="sm"` together with `Button
size="sm"` for compact rows; do not correct a mismatch with one-off `h-*`
classes. The compact input and text-button controls both use the `h-7` target.
Use the default field and `Button size="md"` only when the row is intentionally
regular density, and verify their rendered alignment before shipping.
