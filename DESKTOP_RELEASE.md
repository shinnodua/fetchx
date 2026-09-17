# Desktop release guide

Fetchx bundles the React frontend into a Tauri 2 app. Web deployments continue
through the existing `bun run deploy` Cloudflare workflow. Desktop releases
are independent and are published only from `app-v<version>` tags.

## One-time updater key setup

Generate the updater signing key outside the repository:

```bash
bun tauri signer generate -w ~/.tauri/fetchx.key
```

Replace `REPLACE_WITH_TAURI_UPDATER_PUBLIC_KEY` in
`src-tauri/tauri.conf.json` with the generated public key. Store the private
key and password in GitHub Actions as:

- `TAURI_SIGNING_PRIVATE_KEY`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`

Back up the private key securely. Existing installations cannot accept later
updates if the key is lost.

## Cloudflare setup

Follow `infrastructure/desktop-updates/README.md` to create the R2 bucket,
attach `downloads.fetchx.dev`, and deploy the update Worker at
`updates.fetchx.dev`.

Create a Cloudflare API token restricted to object read/write for the desktop
release bucket, then add these GitHub Actions secrets:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

## Platform signing

For macOS, configure:

- `APPLE_CERTIFICATE`: base64-encoded Developer ID Application `.p12`
- `APPLE_CERTIFICATE_PASSWORD`
- `APPLE_ID`
- `APPLE_PASSWORD`: app-specific password
- `APPLE_TEAM_ID`

For Windows, configure:

- `WINDOWS_CERTIFICATE`: base64-encoded code-signing `.pfx`
- `WINDOWS_CERTIFICATE_PASSWORD`

The updater signature and operating-system signatures solve different trust
problems; production releases require both.

## Publish a release

### Publish from local computers

Set the same version in `package.json`, `src-tauri/Cargo.toml`, and
`src-tauri/tauri.conf.json`. Set `TAURI_SIGNING_PRIVATE_KEY` and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`, 
then build into the shared `desktop-artifacts` directory. On macOS, run:

Inject secrets first
```bash
export $(cat .build.env.local | xargs)
```

Then build:
```bash
bun run desktop:local:build:macos
```

The local macOS build uses Tauri's `--skip-stapling` option so Apple
notarization is submitted without blocking artifact collection. This keeps
signed updater artifacts and DMG installers available in `desktop-artifacts`
even when Apple's notarization queue is slow.

On Windows, run:

```powershell
bun run desktop:local:build:windows
```

The macOS command collects the Apple Silicon artifact, while the Windows
command collects the x64 NSIS artifact. Intel macOS builds are not part of the
supported desktop release matrix. The automatic
`bun run desktop:local:build` command remains available when the operating
system-specific command is not needed. Copy the resulting files into one
`desktop-artifacts` directory when publishing both platforms together. The
publish command can also release only the platform artifacts that exist in the
selected artifact directory, so macOS and Windows can be published separately.

Set `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`, then publish immutable
artifacts and activate the release by uploading `channels/stable.json` last:

```bash
bun run desktop:local:publish
```

Use `--artifact-dir <path>` with either command to override the artifact
directory, and `--notes "Release notes"` with the publish command. Set
`R2_BUCKET` only when publishing to a bucket other than
`fetchx-desktop-releases`.

### Publish through GitHub Actions

1. Update `CHANGELOG.md`.
2. Set the same SemVer in `package.json`, `src-tauri/Cargo.toml`, and
   `src-tauri/tauri.conf.json`.
3. Run `bun run lint:fix` and `bun run build`.
4. Push the code, then create and push `app-v<version>`.
5. The desktop workflow builds, signs, and uploads every platform artifact.
6. The workflow uploads `channels/stable.json` last, atomically advertising
   the completed release to installed apps.

The app checks for updates shortly after startup and also exposes an Updates
button in the desktop header. It refuses to restart while request edits are
unsaved.
