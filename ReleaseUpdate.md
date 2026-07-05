# Release Update Checklist

## Local Publish
1. Bump version in `package.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`.
2. Update `CHANGELOG.md`.
3. Run:
   ```bash
   bun run lint:fix
   bun run build
   ```
4. Set secrets:
   - `TAURI_SIGNING_PRIVATE_KEY`
   - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`
   - `APPLE_CERTIFICATE`
   - `APPLE_CERTIFICATE_PASSWORD`
   - `APPLE_ID`
   - `APPLE_PASSWORD`
   - `APPLE_TEAM_ID`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_API_TOKEN`
5. Build:
   ```bash
   bun run desktop:local:build:macos
   ```
   or
   ```powershell
   bun run desktop:local:build:windows
   ```
6. Publish:
   ```bash
   bun run desktop:local:publish
   ```

## GitHub Release
1. Bump version in the same 3 files.
2. Update `CHANGELOG.md`.
3. Run:
   ```bash
   bun run lint:fix
   bun run build
   ```
4. Push commit.
5. Tag and push:
   ```bash
   app-v<version>
   ```
6. GitHub Actions builds, signs, uploads, and publishes automatically.

For this repo, macOS release is Apple Silicon only.
