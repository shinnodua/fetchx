# Skill: Package Installation with Pinned Versions

This skill guides AI agents to install third-party dependencies with locked/exact versions to ensure builds remain reproducible and stable.

---

## 🛠 Procedure

### Step 1: Install using the Exact Version flag
Always use the exact version pinning flag when running installation commands. Since this project uses **Bun**, use:

```bash
bun add --exact <package-name>
# or
bun add -E <package-name>
```

If you are using `npm` or `pnpm` (which are supported alternatives), use:
```bash
npm install --save-exact <package-name>
# or
pnpm add --save-exact <package-name>
```

---

## 🔍 Verification

### Step 2: Confirm in package.json
Open **[package.json](../../package.json)** and verify that the package has been added under `dependencies` or `devDependencies` with an exact version number without any modifiers:

**Correct:**
```json
"dependencies": {
  "framer-motion": "12.40.0"
}
```

**Incorrect:**
```json
"dependencies": {
  "framer-motion": "^12.40.0"
}
```
If caret or tilde characters are present, manually edit `package.json` to remove them, then run `bun install` to sync the lockfile.
