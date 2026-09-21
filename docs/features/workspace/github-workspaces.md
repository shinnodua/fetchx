# GitHub Workspaces

FetchX includes a permanent **Local Workspace**, which keeps collections in browser storage. The hosted web app keeps the workspace selector visible and links its GitHub Workspaces option to FetchX Desktop. GitHub sync is available in the desktop app only.

The web handoff uses the registered `fetchx://` desktop deep link. If FetchX Desktop is not installed, the user can download it from the footer action.

## Repository layout

A GitHub workspace uses one manifest and one JSON file per collection:

```text
.fetchx/
  workspace.json
  collections/
    <collection-id>.json
```

The manifest preserves collection order and file paths. Collection files store request definitions. Live response data, console logs, unsaved drafts, and local UI state are not written to GitHub.

## Authentication

The desktop connection dialog supports GitHub App device authorization plus classic and fine-grained GitHub personal access tokens. Credentials are stored in the operating system credential store, not Zustand or browser storage.

Before the user starts GitHub App authorization or saves a personal access token, the connection dialog explains that the credential will be stored in the system keychain and that the operating system may request access immediately or after FetchX reopens. On macOS release builds, choosing **Always Allow** lets the same Developer ID-signed FetchX identity reconnect and sync without repeated prompts. Development binaries can prompt again after recompilation because their code identity changes. When the GitHub dialog successfully loads a stored credential, it treats access as granted and hides this guidance. FetchX does not probe Keychain permission during application startup.

After opening the GitHub device-authorization page, FetchX checks the authorization status automatically using the interval GitHub supplies and shows the current polling status. **Check now** remains available for an immediate manual retry.

The desktop GitHub connection dialog constrains itself to the viewport: fields scroll when space is limited, while its Cancel and connect actions remain visible at the bottom. The scroll area includes a focus-safe gutter so input borders and rings remain visible.

GitHub App device authorization reads `VITE_GITHUB_SYNC_CLIENT_ID` and `VITE_GITHUB_SYNC_APP_SLUG` (`fetchx-sync` by default) for connecting existing repositories, and `VITE_GITHUB_CREATE_CLIENT_ID` and `VITE_GITHUB_CREATE_APP_SLUG` (`fetchx-create` by default) when creating a repository. This allows the create-only app to retain its additional Administration permission while keeping synchronization permissions scoped to content.

The desktop bridge performs GitHub device-code requests natively, avoiding browser CORS restrictions on GitHub's OAuth endpoints. Repository discovery also runs through that bridge, avoiding webview CORS restrictions on authenticated GitHub API calls. It queries the authenticated-user repository endpoint and complements it with GitHub App installation repository discovery (`/user/installations/{id}/repositories`) for GitHub App user-to-server tokens, deduplicating the results without pinning a GitHub API version header. Repositories with uninitialized or null default branches safely default to `main`.

When an authorized GitHub App user has not granted access to specific repositories or organizations yet, FetchX provides a **Select repositories on GitHub ↗** action that directs the user to `https://github.com/apps/<app-slug>/installations/new`. When returning to the app, a window `focus` listener automatically reloads the repository list. Users can also click **Reload** or **Grant access to more repositories ↗** at any time.

After a successful authorization for **Connect existing** or when clicking **Load repositories** with a personal access token, FetchX loads the accessible repositories and presents them in a selector with a **Reload** action. Choosing a repository fills its name and default branch before the workspace is connected. When the workspace name is blank, FetchX derives it from the repository name only, without the owner prefix. If GitHub returns no accessible repositories, FetchX displays explanatory guidance and keeps the manual `owner/repository` field available. **Add another account** clears the current selection and immediately starts GitHub App device authorization for another account; a PAT can still be pasted instead. Connected GitHub accounts can also be disconnected from the dialog.

When connecting an existing repository that is completely empty (0 commits) or has not yet been initialized with a FetchX workspace manifest (`.fetchx/workspace.json`), FetchX detects this condition and automatically initializes the repository by pushing the active collections to GitHub, creating the default branch and manifest cleanly. A notification confirms whether existing collections were pulled from GitHub or freshly initialized.

An OAuth token obtained through GitHub App authorization is tied to the selected app (`fetchx-sync` or `fetchx-create`). FetchX persists all GitHub account connections inside one versioned credential map stored under a single operating-system credential account (`connections`) in macOS Keychain, Windows Credential Manager, or Linux Secret Service. Each map entry retains its unique `connection.<id>` key, access token, refresh token, expiry, client ID, account identity, and mode, so workspaces may still use different GitHub accounts without requiring a separate macOS Keychain authorization for every connection. Existing per-connection credential items migrate into the shared vault when first read and are then removed. A workspace stores its selected `connectionId` and non-secret credential key. For a mode with exactly one account, FetchX also keeps a compatible mode-scoped map entry so existing workspaces continue to sync while account-scoped credentials are adopted; that fallback is disabled as soon as another account exists. Application startup does not read stored GitHub credentials, preventing an operating-system credential prompt from blocking the initial UI. FetchX reads and refreshes credentials only after the user opens the GitHub connection flow or explicitly starts a Pull or Push. After an explicit sync, the credential remains in memory for remote commit checks during that app session. Workspaces refresh before sync or retry after a 401 token expiration. Classic and fine-grained PATs are persisted but never refreshed because GitHub does not issue refresh tokens for them. Removing a workspace deletes its connection from the shared vault only when no other workspace uses it.

When performing sync operations (Pull or Push), FetchX resolves credentials only through the workspace's selected connection. A **Connect existing** workspace never falls back to a **Create repository** connection, or to another GitHub account. Startup migration repairs legacy or incomplete workspace records using their original credential key before sync begins.

GitHub workspaces can connect an existing repository, create a personal repository, or create an organization repository when the token has the required organization permission. Creating a repository initializes an empty FetchX manifest, creates a local workspace with no collections, and immediately switches to that new workspace; collections in the previously active workspace are not copied. Connecting with a name matching an existing GitHub workspace smoothly updates and reconnects that workspace rather than conflicting. When a workspace is deleted, its stored credentials in the secure credential store are automatically cleaned up.

GitHub App authorization and installation are separate grants. In **Create repository** mode, FetchX links to the Create App installation page so the user can install or review the app on the personal account or organization that will own the repository before connecting through device authorization. Once an OAuth connection is available, FetchX checks the authenticated user's GitHub App installations for the selected repository owner and displays whether installation is verified. The check runs when the dialog opens, when the owner changes, and when the FetchX window regains focus after the user returns from GitHub. If GitHub rejects creation or the initial sync with `Resource not accessible by integration`, FetchX explains that the target owner must have the Create App installed with **Administration: Read and write**, or the user can provide a personal access token with repository administration access. Existing GitHub App tokens do not automatically gain newly configured permissions until the user approves them.

## Managing workspaces

Open **Manage Workspaces** from the workspace dropdown to access the fullscreen workspace management view.

- **Workspace Overview & Switching**: View all workspaces (Local and GitHub), their linked repositories, branches, sync status, and collection counts. Switch active workspace with a single click.
- **Renaming**: Rename any workspace while enforcing unique workspace names across the app.
- **Moving Collections**: Transfer collections seamlessly between any two workspaces. When moving into a workspace that already contains a collection with the same name, FetchX automatically appends a copy suffix.
- **Removing Workspaces**: Remove unwanted GitHub workspaces with an explicit confirmation dialog. The permanent `Local Workspace` cannot be removed. If the removed workspace is currently active, FetchX safely switches back to the `Local Workspace`. Removing a workspace in FetchX does not delete the remote GitHub repository.

## Sync behavior

Use **Pull from GitHub** to load the workspace files and **Push to GitHub** to write the current collections. Push also deletes collection files that were tracked by the previous workspace manifest and have since been removed locally. These actions synchronize FetchX's `.fetchx/` workspace files, not arbitrary source code in the repository.

Push commit messages describe the detected user action, including adding, deleting, or renaming collections and requests, and updating an individual request. Pushes containing several changes use a collection- or workspace-level update summary.

- **Branch and Commit Indicators**: The workspace dropdown menu dynamically includes the active branch name on both sync actions (e.g. `Pull from GitHub (main)` and `Push to GitHub (main)`).
- **Branch Switching and Creation**: GitHub workspaces can switch to any accessible repository branch or create a new branch from the active branch. Switching first loads that branch's `.fetchx/` workspace files and resets the sync baseline for the selected branch. To prevent accidental cross-branch changes, FetchX requires users with unpushed changes to either push first or explicitly discard those local changes before switching.
- **Pull Requests**: After pushing a clean non-default branch, users can create a pull request from the workspace menu. The dialog defaults the base branch to the repository default, accepts a title and optional description, opens an existing PR from the same branch when one exists, and otherwise creates a new PR and opens it on GitHub. GitHub App and personal access token connections require Pull requests: Read and write in addition to repository Contents access.
- **Unpulled Commits**: FetchX compares the local workspace's last synced commit against the remote branch HEAD using the GitHub Compare API, displaying the number of unpulled remote commits (`ahead_by`) with a highlighted indicator when updates are available.
- **Unified Sync State**: Each GitHub workspace persists one change index alongside its last pulled/pushed collection snapshot. Sidebar name colors, open request-tab title colors, local Push counts, and remote Pull status read this index and remote metadata rather than independently recalculating changes during rendering. This keeps request ordering untouched when a request is saved and makes each UI read constant-time.
- **Workspace Change Colors**: After a GitHub pull or push, collection names, request names, and open request-tab titles read the shared index. Green text identifies a newly added item, while yellow text identifies an existing item that has changed. Live responses and other transient data do not affect these colors.
- **Concurrent Changes**: Before a manual pull or push, FetchX compares the last synced commit with the remote branch and performs a three-way merge against the last synced collection snapshot. Non-overlapping collection and request changes merge automatically. When both sides changed the same value differently, the full-screen conflict editor shows an independent block with the local and GitHub values. Its conflict list scrolls independently while the progress, bulk actions, and final resolution controls remain visible. Each block can keep either side or accept a custom JSON value. Edit/delete collisions explicitly show the deletion choice. The merge can only be applied after every block is resolved with valid JSON. Applying the merge replaces open request drafts with the resolved requests and closes tabs for requests removed by the resolution. The remote snapshot becomes the new sync baseline, so a result that differs from GitHub remains marked for Push.
- **Live Sync Status Indicators**: When initiating a pull or push, FetchX provides visual feedback in multiple locations:
  - **Header Trigger Button**: Replaces the static workspace icon and label with an animated spinner, active direction label (`Pulling…` or `Pushing…`), and a pulsing status dot.
  - **Workspace Dropdown Menu**: The active operation's menu item displays an animated spinner, active status label (e.g. `Pulling from GitHub (main)…`), and a pulsing badge (`Pulling…` or `Pushing…`).
  - **Workspace List**: The active workspace entry indicates active syncing with a spinner and live status label.
  - **Toast Notifications**: System notifications announce when a sync operation starts, finishes successfully with collection/branch details, or fails with actionable error messages.
- **Concurrency Guards**: During an active sync, concurrent pull/push actions and workspace switching are safely disabled until the network operation completes.
- **Switching & Isolation**: A workspace switch clears transient tabs and drafts before loading the selected workspace's collections.

Repository changes remain manual; FetchX only polls commit metadata to present Pull status and detect concurrent updates before an explicit sync action.
