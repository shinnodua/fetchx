# Skill: Code Linting and Formatting (Biome)

This skill guides AI agents to run automated code checks, fix styling issues, and verify type safety before marking any task as complete.

---

## 🛠 Commands

This project uses **Biome** instead of ESLint/Prettier for extremely fast linting and formatting.

### 1. Check for Lint/Formatting Issues
To analyze files for code quality issues and formatting style rule violations, run:
```bash
bun run lint
```

### 2. Auto-Fix Linting and Formatting
To automatically write fixes and format files matching the rules defined in `biome.json`, run:
```bash
bun run lint:fix
```

### 3. Verify TypeScript Compilation
To ensure there are no TypeScript compile-time errors in the codebase:
```bash
bun run build
```

---

## 📅 When to Execute
You **must** run `bun run lint:fix` whenever you:
1. Finish making changes to code files.
2. Are ready to submit your work or request review.
3. Discover syntax or import mismatches during development.
