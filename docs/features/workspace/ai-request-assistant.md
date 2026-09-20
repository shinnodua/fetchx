# AI Request Assistant

The AI request assistant lets desktop users chat with a local AI agent to create and organize request drafts and collections.

## User Flow

The workspace includes a prominent bottom-left AI Assistant launcher. Opening it shows the request assistant panel above the footer. The panel uses a Flamingo-tinted, translucent surface with distinct header and composer bands, so it remains visually separate from the request workspace in light and dark themes. It scales and fades in from the launcher, then reverses that motion when dismissed; reduced-motion preferences disable the transition:

- If no agent is connected, the panel shows a connect action.
- Connect opens a dedicated local-agent dialog and runs discovery through the desktop platform bridge.
- The assistant panel is hidden while the connection dialog is open, then returns when the dialog closes.
- The dialog lists supported localhost model services. The user explicitly connects one.
- When managing a connected agent, the dialog always offers **Use agent default model** as its first choice. It dynamically loads any additional available models from Ollama and OpenAI-compatible local services.
- Model loading shows a clear in-dialog status. React Query caches each agent's discovered models for five minutes, deduplicates concurrent lookups, and retries a transient discovery failure once.
- Refresh repeats detection after the user installs, signs in to, or starts a local agent.
- The selected agent is remembered across app restarts. Opening the assistant refreshes local discovery and restores the selection only when that agent is still available.
- Empty, loading, failure, and web-only states explain what the user should do next.
- When one or more agents are discovered, the user can switch or manage the connected agent and chat.
- The Manage control matches the compact Agent selector height, keeping the connected-agent controls visually aligned.
- Sending immediately adds the user message and an in-progress chat message with a motion-reduced-safe spinning processing icon, disables the composer, and keeps the interface responsive while Rust contacts the selected local HTTP service or explicitly selected installed CLI on a background blocking worker. A CLI retains the permissions configured by its own product, so users should connect only a CLI they trust.
- Chat bubbles wrap long unbroken text, including request URLs, inside the assistant panel.
- Reopening the assistant scrolls the conversation to its newest message.
- Chat history is stored locally across app restarts until the user clears it from the assistant panel. Clearing history requires confirmation, temporarily hides the assistant panel for visibility, and leaves requests, collections, and the selected agent unchanged.
- Creating a request closes the assistant so the new draft is visible. Assistant-created and assistant-opened requests are always drafts for the user to review; they never run automatically.
- When a create or send prompt produces a URL that already belongs to an existing request or unsaved draft, the assistant pauses and asks whether to update that request or create another one. Matching canonicalizes URL query strings and cURL commands, so equivalent cURL requests are recognized. Updating opens the matched request in the workspace and applies the agent's draft there.
- The assistant can create a collection, create a collection with a request already saved inside it, create a request in an existing collection, or save the active request into a named collection.
- Users can ask the assistant to search saved requests by keyword. The assistant fills the Collections sidebar search field and expands the sidebar so matching results are visible.
- Users can ask the assistant to open a saved request by its name or target keyword. A request described as “run” is still opened for review only; the user must use the normal Run control to execute it.
- Agent replies are parsed into a structured request or collection action.
- `create_request` opens a request draft with `addCustomRequest`, then saves it when a collection is named.
- `update_request` patches the active draft with `updateActiveRequest`.
- `create_collection` creates the named collection.
- `create_collection_with_request` creates the collection and saves its new request into it.
- `save_request_to_collection` saves the active request into the named collection.
- `search_requests` fills and activates the Collections sidebar search using `search.keyword`.
- `open_request` opens the best saved request matching `search.keyword`.
- `run_request` opens the best saved request matching `search.keyword` for review only.
- `none` leaves the workspace unchanged and shows the agent message.

## Implementation Boundaries

The assistant keeps model interpretation separate from application mutations:

- `useRequestAssistantController` owns local-agent discovery, sending, pending-message lifecycle, duplicate decisions, and user-facing outcomes.
- `RequestAssistantChat` owns only the launcher, while `RequestAssistantPanel` renders the connected panel, transcript, composer, and dialogs.
- `createAssistantActionPlan` turns a validated agent response plus the current workspace snapshot into a typed action plan. It performs no mutation and is unit-tested independently.
- `executeAssistantActionPlan` is the only layer that applies a plan to workspace actions. This maintains the application—not the model—as the authority that changes drafts, collections, search state, or tabs.
- The persisted chat store exposes append, replacement, and removal operations for stable pending-message lifecycle management. Persisted history is a local transcript, not model context; each model request uses only the current user message and the active-request availability flag.

These boundaries make future structured-output or MCP adapters interchangeable without granting an AI provider direct access to workspace state or mutation APIs.

## Local Discovery

Discovery lives behind `src/services/platform` and is implemented by the focused `src-tauri/src/ai_agents/` Tauri feature module. `src-tauri/src/lib.rs` only registers those commands with the desktop application. The backend resolves every selected agent ID against its fixed allowlist; it does not trust a renderer-provided endpoint or protocol.

The frontend calls the desktop bridge commands `discover_ai_agents`, `discover_ai_agent_models`, and `chat_with_ai_agent`; their names are kept aligned with the corresponding Tauri command handlers.

The bridge discovers supported CLIs from `PATH` and standard GUI-safe install locations, plus localhost HTTP agents on fixed ports. The backend resolves every CLI and HTTP selection from a fixed allowlist; a renderer cannot supply a command, endpoint, or protocol. All agent calls have a 1 MB output limit and a 120-second timeout.

Supported CLI commands are `claude`, `agy`, `codex`, `gemini`, `opencode`, `cursor-agent`, `copilot`, and `kiro-cli`. Fetchx does not send stored request values to either kind of agent and never executes an assistant-created request automatically.

Supported HTTP probes include:

- `http://127.0.0.1:37373` for the Fetchx local agent protocol;
- `http://127.0.0.1:1234` for OpenAI-compatible local servers such as LM Studio;
- `http://127.0.0.1:11434` for Ollama chat.

## Agent Response Contract

Agents receive the user’s message and a boolean stating whether an active request exists; Fetchx does not include stored request names, URLs, headers, bodies, contract arguments, or environment values in the prompt. Agents must respond with JSON:

```json
{
  "message": "Short summary for the user.",
  "action": "create_request",
  "request": {
    "name": "GitHub User",
    "type": "GET",
    "target": "https://api.github.com/users/octocat"
  }
}
```

`action` may be `create_request`, `update_request`, `create_collection`, `create_collection_with_request`, `save_request_to_collection`, `search_requests`, `open_request`, `run_request`, or `none`. Search and request-opening actions include a `search` object such as `{"keyword":"GitHub users"}`. For backward compatibility, the parser also accepts the former `create` and `update` request actions. The parser only accepts fields that exist on `RequestItem`, normalizes allowed method values, and converts any cURL value returned as `request.target` into the corresponding REST request fields before applying changes.

The Fetchx local HTTP protocol accepts `POST /chat` with:

```json
{ "prompt": "..." }
```

It should return one of:

```json
{ "content": "{...structured agent response...}" }
```

```json
{ "message": "{...structured agent response...}" }
```
