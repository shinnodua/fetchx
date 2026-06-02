# AI Agent Developer Guidelines

Welcome! This repository is configured to work with AI coding agents. To maintain code quality, styling consistency, and dependency stability, you **must** adhere to the following core guidelines and use the corresponding skill files when carrying out tasks.

---

## 📋 Core Rules

### 1. Pin Dependency Versions Exactly
Do not use caret (`^`) or tilde (`~`) ranges when adding packages. 
- When installing packages via package manager, always use the exact flag (e.g., `bun add --exact <package>`).
- When manually editing `package.json`, specify exact versions (e.g. `"react": "19.2.6"` instead of `"react": "^19.2.6"`).
- Detailed skill guide: [.antigravity/skills/package-installation.md](file:///Users/shinnodua/Projects/call3/.antigravity/skills/package-installation.md)

### 2. Adhere to the Custom Flamingo Design System
We have custom-designed, premium components located in `src/components/ui/` and exported via `src/components/index.ts`.
- **Do not** write raw elements or style with arbitrary colors (e.g. `bg-red-500` or custom hex codes).
- Use our design system's variables and primary/secondary colors defined under `@theme` in `src/index.css`.
- Always import UI elements from **`../components`** (or `@/components` if aliased). Never bypass the design system.
- Detailed skill guide: [.antigravity/skills/design-system-guideline.md](file:///Users/shinnodua/Projects/call3/.antigravity/skills/design-system-guideline.md)

### 3. Run Linting and Formatting Before Finishing
This project uses Biome for linting and formatting. 
- You must run `bun run lint:fix` (or `biome check --write .`) to ensure the codebase remains clean, formatted, and free of lint errors before completing your turn.
- Detailed skill guide: [.antigravity/skills/lint-and-fix.md](file:///Users/shinnodua/Projects/call3/.antigravity/skills/lint-and-fix.md)

---

## 🛠 AI Agent Skill Directory

Below are the step-by-step procedures to accomplish specific tasks:

1. **[Package Installation Skill](file:///Users/shinnodua/Projects/call3/.antigravity/skills/package-installation.md)**: How to safely add packages to the project.
2. **[Design System Enforcement Skill](file:///Users/shinnodua/Projects/call3/.antigravity/skills/design-system-guideline.md)**: How to build UIs matching the design language.
3. **[Lint and Format Skill](file:///Users/shinnodua/Projects/call3/.antigravity/skills/lint-and-fix.md)**: How to verify and clean up code syntax.
