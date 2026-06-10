# AI Interviewer

*A Claude-backed chat panel in the System Design workspace that can see your current diagram and runs the interview in real time, streaming the model's response token-by-token. One conversation per problem, persisted in SQLite, with a "Restart" button that wipes and starts over.*

## Why

A senior engineer would talk you through a system design problem, react to what you've drawn, and ask probing questions. The dashboard interviewer is the same role, only the user provides their own Anthropic API key and the model isn't on your team's payroll. The goal is to make the practice surface feel like a real interview rather than a static diagramming tool.

## Behavior

### Configuration

Set up at `/settings` ([app/settings/AISettingsForm.tsx](../../../app/settings/AISettingsForm.tsx)):

- **Anthropic API key** (password input) — required.
- **Model** (text input) — defaults to `claude-sonnet-4-6`. Plumbed through the schema/request path so swapping models later is a one-line UI change.
- **Test connection** button — fires a one-token probe and surfaces the resolved model name.

Credentials are stored in the singleton `AICredential` table. See [Credentials & Privacy](../../architecture/credentials-and-privacy.md) for the trust model.

### Auto-greet

When the user first opens the **Interviewer** tab and the conversation is empty, the panel automatically posts a `{kickoff: true}` request. The server synthesizes a user turn ("Hi. I'd like you to interview me on this system design problem...") and lets Claude respond — so you land in an already-introduced interview without having to type anything. The synthetic kickoff message is **not persisted**; only the assistant's greeting lands in the transcript.

### Sending a message

User types in the input at the bottom (⌘/Ctrl+Enter to send). Before POSTing:

1. The panel calls `getSnapshot()` on the workspace, which calls `exportPng()` on the active `ExcalidrawCanvas`. Returns `{ png: base64 | null, label: string | null }`.
2. POSTs to `/api/ai/interview` with `{ problemId, message, diagramPngBase64, diagramLabel, kickoff: false }`.
3. The server appends a user message + image content block to the conversation, streams Claude's response via SSE, and persists both messages on completion.
4. The panel parses SSE frames (`delta` / `done` / `error`), appends streamed text to a live "streaming" bubble, finalizes on `done`, rolls back the optimistic user message on `error`.

If the canvas is empty (no elements drawn), `exportPng()` returns `null` and the request sends `(No diagram drawn yet.)` as a text block instead.

### Save snapshot

A "Save snapshot" button (camera icon) in the panel header, next to Restart, lets the user capture the current chat + diagram as a `DesignSnapshot`. The snapshot then shows up in the new History tab and can be reviewed later in a read-only view. See [snapshots.md](snapshots.md) for the full flow.

### Restart

A "Restart" button in the panel header. Confirms, then calls `resetConversation(problemId, slug)` which deletes the `DesignConversation` row (cascading to its messages). On success, local state clears and the auto-greet fires again. Saved snapshots are **not** affected by restart — they're tied to the problem, not the conversation.

### Empty / missing-credential states

- **No API key configured** → the server returns `412 Precondition Failed` with `"No AI credentials configured. Visit /settings."`; the panel surfaces this inline as an amber-bordered error message.
- **Authentication error from Anthropic** (401) → mapped to a friendlier "Authentication failed — check your API key in Settings."
- **Any other API error** → surfaced as `"API error {status}: {message}"`.

## The system prompt

[lib/ai/interview.ts](../../../lib/ai/interview.ts) builds a system prompt per request that includes the problem title, the prompt text, and the user's notes. It tells Claude to:

- Lead with open-ended questions before drilling into specifics.
- Push on capacity estimates, failure modes, consistency tradeoffs, operational concerns.
- Not volunteer the answer — get the candidate to reason through it.
- Reference what's actually in the diagram concretely ("I see a single load balancer in front of three app servers — what happens if that LB goes down?").
- Keep responses concise (one focused question or one short observation at a time).
- Use markdown formatting where it helps.

## Token cost & caching

The system prompt is wrapped in a `cache_control: { type: "ephemeral" }` block so it's prompt-cached across turns in the same conversation. After the first turn, the system prompt is served from cache at ~10% of the input price, saving roughly 90% of per-turn cost on a typical multi-turn interview. See `shared/prompt-caching.md` in the claude-api skill for the invalidation rules.

The image (PNG of the current canvas) is **not** cached — it changes turn-to-turn.

## Model settings

- **`thinking: { type: "adaptive" }`** — Claude decides when to think and how much. Adaptive thinking on Sonnet 4.6 automatically enables interleaved thinking; no beta header needed.
- **`output_config: { effort: "medium" }`** — balances quality vs latency for chat. Could bump to `"high"` if responses ever feel shallow.
- **`max_tokens: 8192`** — covers a thinking-heavy interviewer turn plus the visible response without truncation.

## Streaming

Built on `client.messages.stream({...})` from `@anthropic-ai/sdk`:

- Server route registers `stream.on("text", delta => send({ type: "delta", text: delta }))` for incremental text.
- After the stream ends, `await stream.finalMessage()` returns the complete message — used to persist the final assistant text and the stop reason.

The route emits SSE frames in the format `data: {...}\n\n` directly into a `ReadableStream`, which Next.js returns with `Content-Type: text/event-stream`. The client uses `fetch()` + a manual `response.body.getReader()` rather than `EventSource` (which doesn't support POST + body).

## Design decisions

- **One conversation per problem, resettable**. Multiple concurrent sessions per problem ("first pass" / "second pass") would be more flexible but adds UI for switching between them. Resetting covers the same need in 80% of cases.
- **Image only, no diagram JSON**. Sending the JSON adds tokens without much benefit — Claude's vision is strong enough to read the diagram from the rendered image. Vision also matches what a real interviewer would see.
- **PNG snapshot is not persisted with messages**. Storing base64 PNGs in SQLite would blow up the DB. We persist `diagramLabel` (which tab was active) so the transcript can later say "you asked this while viewing v2."
- **Kickoff message not persisted**. The synthetic user turn is a server-side prompt-engineering detail, not part of the actual interview. Persisting it would clutter the transcript.
- **Streaming SSE rather than waiting for full response**. Interviewer messages are conversational and benefit hugely from immediate visual feedback. Sonnet 4.6 with adaptive thinking can take 5-10 seconds for a complete response — without streaming, the UI feels broken.

## Key files

- [app/api/ai/interview/route.ts](../../../app/api/ai/interview/route.ts) — POST handler, streams SSE.
- [components/InterviewerPanel.tsx](../../../components/InterviewerPanel.tsx) — client component, SSE consumption, transcript rendering, restart button.
- [lib/ai/anthropic.ts](../../../lib/ai/anthropic.ts) — `getCredentials()`, typed `MissingAICredentialsError`.
- [lib/ai/interview.ts](../../../lib/ai/interview.ts) — `buildSystemPrompt`, `toAnthropicMessages`, `KICKOFF_USER_MESSAGE`.
- [app/settings/AISettingsForm.tsx](../../../app/settings/AISettingsForm.tsx) — credential UI.
- [app/settings/actions.ts](../../../app/settings/actions.ts) — `saveAICredentials`, `testAIConnection`, `clearAICredentials`.
- [app/system-design/[slug]/actions.ts](../../../app/system-design/[slug]/actions.ts) — `resetConversation`.

## Related

- [Workspace](workspace.md) — owns the canvas ref and provides the snapshot function to the panel.
- [Snapshots](snapshots.md) — the Save snapshot button + History tab built on top of the interviewer.
- [Credentials & Privacy](../../architecture/credentials-and-privacy.md) — where the API key lives.
- [Data Model](../../architecture/data-model.md) — `AICredential`, `DesignConversation`, `DesignMessage`.
