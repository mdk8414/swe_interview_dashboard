# Sweatshirt — Architecture

(Codename: SWE Interview Assistant. Display name everywhere user-facing is "Sweatshirt"; the directory and `package.json` `name` field are unchanged for tooling continuity.)

A single-user local web app for tracking three streams of SWE interview prep: LeetCode practice, system design diagrams, and behavioral (STAR) answers. Designed to consolidate what otherwise lives across the LeetCode site, scattered drawings, and Notes/Docs files into one "what have I done, where am I weak, what should I work on next" surface.

> **For per-feature documentation, see [docs/](docs/README.md).** This file covers architecture at a glance; the `docs/` tree covers each feature in detail. When you add or change a feature, update the relevant doc per [docs/conventions/documentation.md](docs/conventions/documentation.md).

**Constraints:**
- Runs entirely on `localhost`; single user
- Online-first (no offline mode)
- AI interviewer ships against the user's own Anthropic API key; provider/model are pluggable via the singleton `AICredential` table

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + Turbopack dev |
| Language | TypeScript |
| Styling | Tailwind CSS 4 (no shadcn/ui — small primitives are hand-rolled in `components/`) |
| ORM / DB | Prisma 6 + SQLite (file at `prisma/dev.db`) |
| LeetCode integration | [`leetcode-query`](https://www.npmjs.com/package/leetcode-query) (GraphQL wrapper, supports session cookie auth) |
| Diagrams | [`@excalidraw/excalidraw`](https://www.npmjs.com/package/@excalidraw/excalidraw), embedded via `next/dynamic({ ssr: false })` |
| Charts | [`recharts`](https://recharts.org/) |
| Icons | [`lucide-react`](https://lucide.dev/) |

## File Layout

```
swe_interview_assistant/
├── app/
│   ├── layout.tsx                          # Sidebar nav shell
│   ├── page.tsx                            # Dashboard (3 summary cards)
│   ├── leetcode/
│   │   ├── page.tsx                        # Sortable problem table + filters
│   │   ├── stats/page.tsx                  # Charts + gap analysis + suggestions
│   │   └── settings/
│   │       ├── page.tsx                    # Cookie input + Sync button
│   │       ├── SettingsForm.tsx            # Client form
│   │       └── actions.ts                  # Server actions: save / clear / triggerSync
│   ├── system-design/
│   │   ├── page.tsx                        # Problem list
│   │   └── [slug]/
│   │       ├── page.tsx                    # Detail (server)
│   │       ├── DesignWorkspace.tsx         # Split view: notes + diagram tabs
│   │       └── actions.ts                  # Notes + diagram CRUD
│   ├── behavioral/
│   │   ├── page.tsx                        # Category accordion
│   │   └── [id]/
│   │       ├── page.tsx                    # STAR question detail
│   │       ├── StarForm.tsx                # Autosaving form (client)
│   │       └── actions.ts                  # Upsert answer
│   └── api/
│       └── leetcode/sync/route.ts          # POST trigger (mirrors triggerSync action)
├── components/
│   ├── Nav.tsx                             # Sidebar
│   ├── Card.tsx                            # Dashboard card
│   ├── ExcalidrawCanvas.tsx                # Dynamic Excalidraw + debounced autosave
│   ├── CategoryChart.tsx                   # Two recharts components, both with show-total toggle
│   └── GapAnalysisTable.tsx                # Sortable + paginated + breakdown toggle
├── lib/
│   ├── db.ts                               # Prisma client singleton (resolves SQLite via cwd-absolute path)
│   ├── utils.ts                            # cn() helper
│   ├── leetcode/
│   │   ├── client.ts                       # getAuthedClient() / getAnonClient()
│   │   ├── sync.ts                         # runSync(): catalog + submission upsert
│   │   └── analysis.ts                     # tagStats / difficultyBreakdown / suggestProblems
│   ├── seed/
│   │   ├── system-design.ts                # 10 classic problems
│   │   └── behavioral.ts                   # 10 categories × ~3 questions
│   └── generated/prisma/                   # Generated client (gitignored)
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   ├── migrations/
│   └── dev.db                              # gitignored
├── prisma.config.ts                        # Resolves DATABASE_URL to absolute path
└── .env                                    # DATABASE_URL only
```

## Data Model

The current schema (see [prisma/schema.prisma](prisma/schema.prisma) for source of truth):

- **`LeetCodeProblem`** — id, slug, title, difficulty, JSON-encoded `tags`, `url`, `isPaid`, `acRate`. Relation → `submissions`.
- **`LeetCodeSubmission`** — `problemId`, `status` (e.g. `ACCEPTED`), `language`, `submittedAt`. The catalog sync inserts a synthetic `ACCEPTED` row when LeetCode marks the problem as solved but no real submission record has been pulled yet.
- **`LeetCodeCredential`** — single row (`id = 1`) with `sessionCookie`, `csrfToken`, `username`, `lastSyncAt`. Plaintext, local-only.
- **`SystemDesignProblem`** — slug, title, prompt, optional markdown `notes`, relation → `diagrams`.
- **`Diagram`** — belongs to a problem, stores Excalidraw `sceneJson`, has a label (`v1`, `v2`, …).
- **`BehavioralCategory`** / **`BehavioralQuestion`** / **`BehavioralAnswer`** — categories own questions; answers store `situation` / `task` / `action` / `result` (each `@default("")`) plus an optional `projectTag` for cross-linking.

## Module — LeetCode

### Credentials & sync

1. User pastes their `LEETCODE_SESSION` cookie at `/leetcode/settings`. `csrftoken` is optional — `leetcode-query`'s `Credential.init(session)` auto-fetches one when omitted.
2. Cookies are upserted into the `LeetCodeCredential` singleton via the `saveCredentials` server action.
3. `runSync()` ([lib/leetcode/sync.ts](lib/leetcode/sync.ts)):
   - Pages the public problem catalog (`category: "all-code-essentials"`, 100 per page, up to 30 pages) → upsert `LeetCodeProblem`. If a problem's `status === "ac"`, ensure at least one synthetic `ACCEPTED` `LeetCodeSubmission` exists.
   - Pulls the most recent ~50 authenticated submissions → upsert real submission rows (id is composed from `problemId-timestamp-lang` so re-syncs are idempotent). Failures here are caught and logged; catalog data still lands.
   - Updates `lastSyncAt` and resolved `username`.

The sync is reachable both via the server action `triggerSync` (UI button) and `POST /api/leetcode/sync` (curl-friendly).

### Problem list (`/leetcode`)

Server-rendered table. Filters and sort live in the URL so deep links work and the filter form preserves the active sort via hidden inputs.

- **Filters:** `q` (title contains), `difficulty`, `status` (solved/untouched), `tag`. Filtering happens in Prisma except for `status`, which depends on the joined submission count and is filtered post-fetch.
- **Sorting:** `sort` ∈ `id | title | difficulty | status`, `dir` ∈ `asc | desc`. Difficulty sorts by rank (Easy → Medium → Hard); status sorts by solved-or-not; both fall back to `id` as tiebreaker. Tags column is intentionally not sortable.
- **Responsive tags column:** progressively reveals more tags as the viewport widens — 1 tag at `md`, 2 at `lg`, 3 at `xl`, hidden below `md`. Pure CSS, no JS measurement.
- **Safety net:** `overflow-x-auto` with `min-w-[560px]` on the table so nothing gets clipped at very narrow widths.

### Stats (`/leetcode/stats`)

Three sections, all driven by `tagStats()` / `difficultyBreakdown()` / `suggestProblems()` in [lib/leetcode/analysis.ts](lib/leetcode/analysis.ts):

- **Solved by tag** and **Solved by difficulty** charts — bar charts with a "Show total available" toggle (default OFF). When OFF only the green "solved" bars render and the Y-axis rescales so progress is actually visible.
- **Gap analysis table** — interactive client component. Per-tag columns: Solved/Total (with hover tooltip showing E/M/H breakdown), optional E/M/H columns toggled by checkbox, Weakness score. Sortable on every column, paginated (25 per page), default sort is Weakness desc.
- **Suggested next problems** — top 5 unsolved free problems weighted toward the user's weakest tags and acceptance rate within `[0.3, 0.7]`.

#### Weakness formula

`weakness = 1 / (1 + strength)`, where:

```
strength = 0.5·easySolved + 1.0·mediumSolved + 1.5·hardSolved
```

Notes on this design:
- **Tag size intentionally ignored.** Solving 10 problems in a small-tag (Heap) and 10 problems in a large-tag (Array) should score the same weakness. The earlier `1 − strength/maxPossible` form was rejected for exactly this reason — coverage-based scoring punished users for engaging with tags that happen to have many problems.
- **Bounded `(0, 1]`.** Untouched tag → 1; weakness asymptotically approaches 0 as you solve more, never reaches it.
- **Smooth, no sentinels.** Earlier `1/strength` had a singularity at zero (handled by an arbitrary `3` sentinel) which broke the "untouched = max weakness" invariant once any tag's strength dropped below `1/3`. Adding the `+1` denominator fixes both issues.

## Module — System Design

`/system-design` lists problems with diagram counts. `/system-design/[slug]` is a split view: prompt + markdown notes on the left, Excalidraw canvas on the right.

`ExcalidrawCanvas` ([components/ExcalidrawCanvas.tsx](components/ExcalidrawCanvas.tsx)) handles the Next.js dynamic-import recipe (`ssr: false`) and runs the autosave loop:
- `onChange` builds a JSON snapshot, drops the `Map`-typed `collaborators` field, and debounces a write through the `saveDiagram` server action (800ms).
- An unmount-time effect flushes the latest serialized state so navigating away doesn't lose the last few keystrokes.

Multi-diagram tabs let you keep "v1 — naive" / "v2 — sharded" iterations side by side. Notes autosave separately on every keystroke through `saveNotes`.

## Module — Behavioral (STAR)

`/behavioral` is an accordion grouped by category, with status badges (Unanswered / Drafted / Polished) computed from how many of the four STAR fields are populated.

`/behavioral/[id]` is the editor: four labeled textareas (Situation / Task / Action / Result) with an optional `projectTag` field for the planned v2 project↔question mapper. Saves debounced 700ms via the `saveAnswer` server action.

## Dashboard (`/`)

Three cards summarizing each module:
- **LeetCode:** total solved (distinct problems), accepted submissions in last 7 days, weakest tag (`tagStats()[0].tag` since the array is sorted weakest-first).
- **System Design:** problem count, diagram count.
- **Behavioral:** answered / total questions, weakest category by lowest answered ratio.

If the LeetCode card shows zero solved, an inline link prompts the user to set up sync.

## Operational notes

### SQLite path quirk

Prisma resolves SQLite URLs **relative to the directory containing `schema.prisma`**, not relative to the runtime CWD. With `DATABASE_URL=file:./dev.db` we'd end up reading `prisma/dev.db` from the CLI but failing to find it from the Next.js runtime. Worked around in [lib/db.ts](lib/db.ts) by passing an absolute `file:` URL into `new PrismaClient({ datasources })`, computed via `path.resolve(process.cwd(), "prisma", "dev.db")`. Mirrored in [prisma.config.ts](prisma.config.ts) so CLI and runtime agree on the same file.

### Where credentials live

`prisma/dev.db` (gitignored) → `LeetCodeCredential` table, plaintext. Acceptable for v1 single-user local. If you ever back up or share the DB, that cookie is session-equivalent to your LeetCode login. Encryption-at-rest is the obvious v2 hardening.

## v2 Hooks (designed for, not built)

The schema and routing accommodate these as additive features:

- **LeetCode "what next" agent** — feed `tagStats()` + recent solves to a model, return ranked picks with rationale. Plug into a new `/api/ai/leetcode-suggest` route.
- **System Design interviewer** — chat panel beside the canvas. Add a `DesignConversation` table FK'd to `SystemDesignProblem`.
- **Behavioral feedback** — score an answer along specificity / impact / ownership / learning. Add `BehavioralAnswerScore`.
- **Project ↔ question mapper** — over `BehavioralAnswer.projectTag` values, suggest questions a project could answer that haven't been used yet.

When this work happens, decide on AI provider (Anthropic SDK is the obvious default for this codebase) and add the route handlers under `app/api/ai/`.

## Open questions

- Move the SQLite file to `~/.swe-interview-assistant/db.sqlite` so `rm -rf` on the repo doesn't destroy data.
- Encrypt cookies (passphrase-derived key + libsodium).
- Export / import: ship a JSON dump command if multi-device ever becomes a need.
