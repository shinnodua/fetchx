# AI Agent Developer Guidelines

Welcome! This repository is configured to work with AI coding agents. To maintain code quality, styling consistency, and dependency stability, you **must** adhere to the following core guidelines and use the corresponding skill files when carrying out tasks.

---

## 📋 Core Rules

### 1. Pin Dependency Versions Exactly
Do not use caret (`^`) or tilde (`~`) ranges when adding packages. 
- When installing packages via package manager, always use the exact flag (e.g., `bun add --exact <package>`).
- When manually editing `package.json`, specify exact versions (e.g. `"react": "19.2.6"` instead of `"react": "^19.2.6"`).
- Detailed skill guide: [.antigravity/skills/package-installation.md](./.antigravity/skills/package-installation.md)

### 2. Adhere to the Custom Flamingo Design System
We have custom-designed, premium components located in `src/components/ui/` and exported via `src/components/index.ts`.
- **Do not** write raw elements or style with arbitrary colors (e.g. `bg-red-500` or custom hex codes).
- Use our design system's variables and primary/secondary colors defined under `@theme` in `src/index.css`.
- Always import UI elements from **`../components`** (or `@/components` if aliased). Never bypass the design system.
- Detailed skill guide: [.antigravity/skills/design-system-guideline.md](./.antigravity/skills/design-system-guideline.md)

### 3. Run Linting and Formatting Before Finishing
This project uses Biome for linting and formatting. 
- You must run `bun run lint:fix` (or `biome check --write .`) to ensure the codebase remains clean, formatted, and free of lint errors before completing your turn.
- Detailed skill guide: [.antigravity/skills/lint-and-fix.md](./.antigravity/skills/lint-and-fix.md)

### 4. Add Unit Tests for Every Task
Every code change must include or update unit tests that cover the behavior changed by the task.
- Put unit tests in a `test/` folder at the same directory level as the source code under test, for example `src/features/workspace/utils/test/requestImport.test.ts` for `src/features/workspace/utils/requestImport.ts`.
- Use `bun test` / `bun run test` for unit tests, and run the relevant tests before finishing.
- If a task truly cannot be covered by a unit test, explain the reason clearly in the final response.

### 5. Keep Documentation Updated
Every code change must update the relevant docs when behavior, architecture, feature scope, configuration, or developer workflow changes.
- When adding a new feature, create a matching document under `docs/features/<feature-name>/` and link it from `docs/README.md`.
- When changing an existing feature, update the nearest existing document under `docs/` so future contributors can understand the current behavior.
- If a change truly does not require docs, explain why in the final response.

### 6. Adhere to the Feature-Based Architecture
We organize source files around capabilities under `src/features/`. Route files under `src/routes/` are thin wrapper modules. Global stores and services go to `src/store/` and `src/services/`.
- Before implementing or modifying code, read and follow **[CODE_CONVENTION.md](./CODE_CONVENTION.md)**. Code changes must comply with its architecture, file placement, component, styling, TypeScript, and Biome rules.
- Detailed code convention guide: [CODE_CONVENTION.md](./CODE_CONVENTION.md)

### 7. Skip Manual Verification unless Requested
Do not run manual or browser-based verification steps unless they are explicitly requested in the user prompt.

### 8. Clarify Unclear Requirements Before Implementing
If any requirement is ambiguous, incomplete, contradictory, or could reasonably be interpreted in multiple ways, ask the user for clarification before making code changes. Do not assume intent when the implementation choice could affect behavior, architecture, user experience, dependencies, or data.

---

## 🛠 AI Agent Skill Directory

Below are the step-by-step procedures to accomplish specific tasks:

1. **[Package Installation Skill](./.antigravity/skills/package-installation.md)**: How to safely add packages to the project.
2. **[Design System Enforcement Skill](./.antigravity/skills/design-system-guideline.md)**: How to build UIs matching the design language.
3. **[Lint and Format Skill](./.antigravity/skills/lint-and-fix.md)**: How to verify and clean up code syntax.
4. **[Code Convention Guide](./CODE_CONVENTION.md)**: Detailed rules on repository layouts, stores, and services.
