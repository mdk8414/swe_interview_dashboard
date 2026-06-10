# Data Model

*Every Prisma model in [prisma/schema.prisma](../../prisma/schema.prisma), grouped by module. Each row covers what the model represents and the non-obvious design choices.*

The full schema is the source of truth. This doc is for orientation — read it once, then go to the schema for exact field types.

## LeetCode

### `LeetCodeProblem`

The full catalog of problems pulled from LeetCode, keyed on the LeetCode question id. Tags are stored as a JSON-encoded string (SQLite has no native array type — we encode and decode in [lib/leetcode/sync.ts](../../lib/leetcode/sync.ts) and [lib/leetcode/analysis.ts](../../lib/leetcode/analysis.ts)). `acRate` is the platform-wide acceptance rate, used as one input to the suggestion algorithm.

### `LeetCodeSubmission`

One row per attempt. The catalog sync inserts a synthetic `ACCEPTED` row when LeetCode marks the problem as solved but no real submission has been pulled yet — this keeps the dashboard's "solved count" honest before the user's submission history fully syncs. The composite index on `(problemId, submittedAt)` supports the "last submitted" query on the problem list.

### `LeetCodeCredential`

Singleton (`id = 1` default). Holds the user's `sessionCookie` (`LEETCODE_SESSION`), optional `csrfToken`, the resolved `username`, and `lastSyncAt`. Stored plaintext — see [credentials-and-privacy.md](credentials-and-privacy.md).

## System Design

### `SystemDesignProblem`

A seeded problem (URL Shortener, Twitter Timeline, etc. — see [lib/seed/system-design.ts](../../lib/seed/system-design.ts)). Holds the prompt, optional markdown notes, plus relations to its diagrams and (optional) AI conversation.

### `Diagram`

Belongs to a problem, holds the Excalidraw scene as JSON in `sceneJson`, and a `label` (`v1`, `v2`, etc.) that names the tab in the workspace. Multiple per problem, ordered by `updatedAt`. `onDelete: Cascade` ensures deleting a problem removes its diagrams.

## Behavioral

### `BehavioralCategory` / `BehavioralQuestion`

Seeded from [lib/seed/behavioral.ts](../../lib/seed/behavioral.ts). Ten categories (Leadership, Conflict, Failure, …) each owning a handful of common questions. `isCommon` is unused today — it's there for a future "most popular" filter.

### `BehavioralAnswer`

The user's STAR answer for one question. The four STAR fields (`situation`, `task`, `action`, `result`) all have `@default("")` so the autosave path in [app/behavioral/[id]/actions.ts](../../app/behavioral/[id]/actions.ts) can upsert without worrying about nullable columns. `projectTag` is an optional free-text tag used in the planned v2 project↔question mapper.

## AI / Interviewer

### `AICredential`

Singleton (`id = 1`). Holds the Anthropic `apiKey`, the `provider` (currently always `"anthropic"`), and the default `model` (defaults to `claude-sonnet-4-6`). The `provider` column exists so a future OpenAI integration can sit alongside without a migration.

### `DesignConversation`

One per `SystemDesignProblem` (`@unique problemId`). Captures the `model` at conversation creation so a later model switch doesn't quietly change the personality mid-interview. Restarting an interview deletes and recreates the row.

### `DesignMessage`

A single turn in a conversation, with `role` (`"user"` | `"assistant"`) and `content` (markdown). `diagramLabel` records which diagram tab was active when a user message was sent, so the transcript can later say "you asked this while viewing v2". The composite index on `(conversationId, createdAt)` supports the in-order replay query on workspace mount.

### `DesignSnapshot`

A point-in-time capture of the chat + diagram, created when the user clicks "Save snapshot" in the Interviewer. Holds the formatted `transcript` text plus the base64-encoded `diagramPng` (nullable — empty canvases save without an image) and the `diagramLabel` at capture time. Scoped to the **problem**, not the conversation, so `Restart interview` doesn't wipe history. Optional `name` for user-given labels; the History list falls back to the timestamp when `name` is null. The composite index on `(problemId, createdAt)` supports the newest-first list query. See [features/system-design/snapshots.md](../features/system-design/snapshots.md).

## Singleton tables

`LeetCodeCredential` and `AICredential` both use `@id @default(1)` — they're meant to hold exactly one row. The credential forms upsert by `id: 1`. This is a deliberate simplification: the app is single-user, so there's only ever one set of credentials. If we ever support multiple AI providers concurrently, this collapses naturally into a per-provider table keyed on `provider`.

## Related

- [Architecture Overview](overview.md) — where this DB sits in the system.
- [Credentials & Privacy](credentials-and-privacy.md) — what gets stored in the singleton credential tables.
