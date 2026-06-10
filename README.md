# Sweatshirt

Built for SWEs. A local web app for tracking software-engineering interview prep across three streams:

- **LeetCode** — pull your solved problems from LeetCode, see breakdowns by tag and difficulty, find the gaps you should fill next.
- **System Design** — drawable Excalidraw canvas for each classic problem, with markdown notes and multiple diagram revisions per problem.
- **Behavioral (STAR)** — curated question bank organized by category with a Situation / Task / Action / Result editor that autosaves.

Single-user, runs entirely on `localhost`. All data lives in a local SQLite file.

## Quick Start

```bash
npm install
npx prisma migrate dev          # creates SQLite DB + applies schema
npx prisma db seed              # seeds system-design problems + behavioral questions
npm run dev                     # http://localhost:3000
```

That's it for the system design and behavioral modules — they're usable immediately. To enable LeetCode tracking, see below.

## Connecting LeetCode

LeetCode has no public API, so syncing your solved problems requires the same session cookie your browser uses.

1. Log in at [leetcode.com](https://leetcode.com).
2. Open DevTools → **Application** (Chrome) or **Storage** (Firefox) → **Cookies → https://leetcode.com**.
3. Copy the value of `LEETCODE_SESSION`.
4. In the app, open **Settings** in the sidebar and paste it. The `csrftoken` field is optional — the library will fetch one automatically if you leave it blank.
5. Click **Sync now**. First sync takes 30–60s while it pages through the catalog; subsequent syncs are faster.

Cookies are stored in plaintext in your local SQLite database. They never leave your machine, but anyone with access to the file effectively has access to your LeetCode account — keep it that way.

## What's in the box

| Route | Purpose |
|---|---|
| `/` | Dashboard — solved counts, "weakest" tag/category, quick links |
| `/leetcode` | Sortable, filterable problem table with deep-link URL params |
| `/leetcode/stats` | Bar charts (with toggle for total available) + interactive gap-analysis table + suggested next problems |
| `/leetcode/settings` | Cookie input + Sync button |
| `/system-design` | List of seeded classic problems |
| `/system-design/[slug]` | Notes + Excalidraw canvas with multi-diagram tabs |
| `/behavioral` | Question bank grouped by category with status badges |
| `/behavioral/[id]` | STAR answer editor (autosaves) |

## Tech Stack

Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · Prisma + SQLite · `leetcode-query` · `@excalidraw/excalidraw` · `recharts` · `lucide-react`

## Where Data Lives

- **Database**: `prisma/dev.db` (gitignored).
  - LeetCode catalog + your submissions
  - System design problems + diagrams
  - Behavioral categories / questions / answers
  - LeetCode session cookie (single-row `LeetCodeCredential` table)
- **Inspect with Prisma Studio**: `npx prisma studio`
- **Reset everything**: `rm prisma/dev.db && npx prisma migrate dev && npx prisma db seed`

## Useful Commands

```bash
npm run dev                     # dev server (Turbopack)
npm run build                   # production build
npm run lint                    # eslint
npx prisma studio               # GUI DB browser
npx prisma migrate dev          # apply schema changes
npx prisma db seed              # re-run seed
npx tsc --noEmit                # type-check
```

## Roadmap (v2)

The schema and routing leave space for these without restructuring:

- AI "what should I do next" agent for LeetCode (uses tag stats + recent solves)
- AI interviewer chat panel alongside the system design canvas
- Behavioral answer scoring (specificity / impact / ownership / learning)
- Project-tag → behavioral-question mapper

See [CLAUDE.md](CLAUDE.md) for the full architecture and design decisions.
