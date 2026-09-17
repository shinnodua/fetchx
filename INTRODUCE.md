<p align="center">
  <img src="./public/favicon.svg" alt="fetchx.dev logo" width="96" height="96">
</p>

<h1 align="center">fetchx.dev</h1>

fetchx.dev is a unified workspace for testing REST APIs and interacting with
smart contracts. It brings everyday API tools and Web3 workflows into one
focused interface, so you can build, test, organize, and reuse requests without
switching between multiple applications.

Whether you are exploring an API, reading contract state, preparing a
transaction, or managing a growing request collection, fetchx.dev keeps the
workflow clear and approachable.

## Easy to Use from the First Request

fetchx.dev is designed to reduce setup and repetitive work.

- Create REST or smart contract requests from the same workspace.
- Paste a cURL command, Fetch snippet, or URL with query parameters to populate
  a request automatically.
- Work with multiple requests in tabs and quickly save, rename, duplicate,
  reorder, or reveal them in their collections.
- Organize related requests into searchable, collapsible collections.
- Use a clean response viewer with status, duration, structured payloads, and
  execution logs.
- Keep drafts and workspace state available between browser sessions.
- Switch between light and dark themes for a comfortable working environment.

The interface provides the flexibility of a professional API client while
remaining simple enough for quick experiments.

## Everything You Need in One Workspace

### REST API Testing

Build and execute `GET`, `POST`, `PUT`, `PATCH`, and `DELETE` requests with:

- Query parameters
- Custom headers
- JSON request bodies
- Environment variables
- Response status and timing
- JSON and text response inspection
- Direct browser requests with an optional proxy fallback when CORS blocks the
  request

### Smart Contract Interaction

Interact with EVM-compatible smart contracts without maintaining separate
scripts:

- Read contract state through ABI-defined functions.
- Execute write functions through a connected wallet.
- Enter and format contract arguments with support for common ABI types.
- Select from supported networks or configure custom RPC endpoints.
- Import contract ABIs and work with built-in ERC-20, ERC-721, and ERC-1155
  definitions.
- Follow transaction hashes, confirmations, block numbers, status, and gas
  usage.

### Reusable Environments

Create environments for development, testing, staging, or production and use
`{{variable}}` placeholders across:

- URLs and contract addresses
- Query parameters
- Headers
- Request bodies
- Contract arguments

Changing an environment updates the values used by your requests without
requiring you to edit every request manually.

### Collection and Import Tools

fetchx.dev helps your workspace grow without becoming difficult to manage:

- Create, rename, duplicate, search, and organize collections.
- Import requests from cURL, Fetch, URLs, or structured request definitions.
- Export and transfer request collections for backup or reuse.
- Track unsaved changes and receive a warning before leaving the page.
- Preserve drafts, open tabs, and workspace preferences locally.

## Security and Privacy by Design

fetchx.dev includes practical safeguards for handling API credentials, private
configuration, and blockchain transactions.

### Protected Sensitive Variables

Environment values can be marked as sensitive. These values are encrypted
before they are saved using:

- AES-256-GCM authenticated encryption
- A key derived from your PIN with PBKDF2 and SHA-256
- A unique random salt and initialization vector
- 210,000 key-derivation iterations

Your PIN is not stored. Sensitive plaintext is removed from persisted workspace
data and is available only while the environment is unlocked in the current
session.

### Reduced Secret Exposure

Sensitive values are redacted from request logs, response data, and error
messages where they might otherwise be displayed. Requests that depend on
locked sensitive variables are stopped until those values are explicitly
unlocked.

### Wallet-Controlled Transactions

fetchx.dev does not sign blockchain transactions on your behalf. Contract write
operations are sent to your connected wallet, where you can review and approve
the transaction before it is submitted. Read-only contract calls do not require
a wallet signature.

### Local-First Workspace

Collections, drafts, environments, and preferences are stored in your browser,
giving you direct control over your working data. Network requests are sent
only when you choose to execute them. When a REST request cannot be completed
directly because of browser CORS restrictions, the proxy fallback is used only
for that blocked request.

## Built for Confident Development

fetchx.dev combines an easy learning curve with the tools needed for real API
and Web3 development. You can begin with a simple request, then add reusable
environments, encrypted credentials, custom networks, contract ABIs, organized
collections, and repeatable workflows as your project grows.

One workspace. Fewer interruptions. The features you need, with security and
control kept close to the developer.
