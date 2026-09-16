# AI Request Assistant

The AI request assistant lets desktop users chat with a local AI agent to create and organize request drafts and collections.

## User Flow

The workspace includes a prominent bottom-left AI Assistant launcher. Opening it shows the request assistant panel above the footer. The panel uses a Flamingo-tinted, translucent surface with distinct header and composer bands, so it remains visually separate from the request workspace in light and dark themes:

- If no agent is connected, the panel shows a connect action.
- Connect opens a dedicated local-agent dialog and runs discovery through the desktop platform bridge.
- The assistant panel is hidden while the connection dialog is open, then returns when the dialog closes.
- The dialog lists detected CLI and localhost agents. The user explicitly connects one, matching the runtime-selection pattern used by Multica.
- When managing a connected agent, the dialog always offers **Use agent default model** as its first choice. It dynamically loads any additional available models. Antigravity, Ollama, and OpenAI-compatible local services expose a model list; other CLIs keep their configured default model when their CLI does not provide model discovery.
- Model loading shows a clear in-dialog status. React Query caches each agent's discovered models for five minutes, deduplicates concurrent lookups, and retries a transient discovery failure once.
- Refresh repeats detection after the user installs, signs in to, or starts a local agent.
- The selected agent is remembered across app restarts. Opening the assistant refreshes local discovery and restores the selection only when that agent is still available.
- Empty, loading, failure, and web-only states explain what the user should do next.
- When one or more agents are discovered, the user can switch or manage the connected agent and chat.
- Sending immediately adds the user message and an in-progress chat message with a motion-reduced-safe spinning processing icon, disables the composer, and keeps the interface responsive while Rust runs the local-agent task on a background blocking worker. The prompt directs every connected CLI agent to answer directly without using tools, so headless Claude Code, Antigravity, and Codex chats do not wait for an interactive permission request.
- Chat bubbles wrap long unbroken text, including request URLs, inside the assistant panel.
- Reopening the assistant scrolls the conversation to its newest message.
- Chat history is stored locally across app restarts until the user clears it from the assistant panel. Clearing history requires confirmation, temporarily hides the assistant panel for visibility, and leaves requests, collections, and the selected agent unchanged.
- Creating a request closes the assistant so the new draft is visible. Prompts that explicitly ask to send, run, execute, perform, or do the request automatically run the new draft; create-only prompts leave it ready for review.
- When a create or send prompt produces a URL that already belongs to an existing request or unsaved draft, the assistant pauses and asks whether to update that request or create another one. Matching canonicalizes URL query strings and cURL commands, so equivalent cURL requests are recognized. Updating opens the matched request in the workspace and applies the agent's draft there.
- The assistant can create a collection, create a collection with a request already saved inside it, create a request in an existing collection, or save the active request into a named collection.
- Agent replies are parsed into a structured request or collection action.
- `create_request` opens a request draft with `addCustomRequest`, then saves it when a collection is named.
- `update_request` patches the active draft with `updateActiveRequest`.
- `create_collection` creates the named collection.
- `create_collection_with_request` creates the collection and saves its new request into it.
- `save_request_to_collection` saves the active request into the named collection.
- `none` leaves the workspace unchanged and shows the agent message.

## Local Discovery

Discovery lives behind `src/services/platform` and is implemented by the focused `src-tauri/src/ai_agents/` Tauri feature module. `src-tauri/src/lib.rs` only registers those commands with the desktop application.

The frontend calls the desktop bridge commands `discover_ai_agents`, `discover_ai_agent_models`, and `chat_with_ai_agent`; their names are kept aligned with the corresponding Tauri command handlers.

The bridge discovers two kinds of agents:

- local CLI agents on `PATH`, following the Multica-style runtime detection model;
- localhost HTTP agents on known ports.

Supported CLI commands include `claude` (Claude Code), `agy` (Google Antigravity CLI), `codex`, `gemini`, `opencode`, `cursor-agent`, `copilot`, and `kiro-cli`.

The bridge launches each CLI according to its prompt format: Claude Code and Antigravity receive the prompt as the value of their `-p` option, while positional-prompt CLIs use a delimiter so messages beginning with a dash remain user content. Antigravity is launched in a new project session, so it can respond from the desktop app even when the app was not opened from a repository. A successful CLI run that produces no response is reported as an agent error and includes its diagnostic output when available.

Supported HTTP probes include:

- `http://127.0.0.1:37373` for the Call3 local agent protocol;
- `http://127.0.0.1:1234` for OpenAI-compatible local servers such as LM Studio;
- `http://127.0.0.1:11434` for Ollama chat.

## Agent Response Contract

Agents receive a prompt containing the active request and must respond with JSON:

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

`action` may be `create_request`, `update_request`, `create_collection`, `create_collection_with_request`, `save_request_to_collection`, or `none`. For backward compatibility, the parser also accepts the former `create` and `update` request actions. The parser only accepts fields that exist on `RequestItem`, normalizes allowed method values, and converts any cURL value returned as `request.target` into the corresponding REST request fields before applying changes.

The Call3 local HTTP protocol accepts `POST /chat` with:

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
