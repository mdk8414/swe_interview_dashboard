# Architecture Overview

*A single-user Next.js app with a local SQLite database. Server components do the data fetching; client components do the interactive bits. External calls (LeetCode sync, AI interviewer) use credentials the user enters in `/settings`.*

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + React 19, Turbopack dev |
| Language | TypeScript |
| Styling | Tailwind CSS 4 (hand-rolled primitives in `components/` — no shadcn/ui) |
| ORM / DB | Prisma 6 + SQLite (file at `prisma/dev.db`) |
| Charts | [recharts](https://recharts.org/) |
| Diagrams | [@excalidraw/excalidraw](https://www.npmjs.com/package/@excalidraw/excalidraw), embedded via `next/dynamic({ ssr: false })` |
| LeetCode | [leetcode-query](https://www.npmjs.com/package/leetcode-query) (GraphQL wrapper) |
| AI | [@anthropic-ai/sdk](https://www.npmjs.com/package/@anthropic-ai/sdk), streaming Messages API |
| Icons | [lucide-react](https://lucide.dev/) |

## File Layout

```
sweatshirt/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root shell + sidebar nav + ambient glow backdrop
│   ├── page.tsx                      # Dashboard
│   ├── leetcode/                     # Problem list, stats, settings
│   ├── system-design/                # Problem list + per-problem workspace
│   ├── behavioral/                   # Question bank + STAR editor
│   ├── settings/                     # Unified settings (LeetCode + AI)
│   └── api/
│       ├── leetcode/sync/route.ts    # POST: trigger LeetCode sync
│       └── ai/interview/route.ts     # POST: streaming SSE interviewer
├── components/                       # Reusable presentational + small interactive components
├── lib/
│   ├── db.ts                         # Prisma client singleton
│   ├── utils.ts                      # cn() helper
│   ├── ai/                           # Anthropic client + interview helpers
│   ├── dashboard/                    # Today's focus, recent activity, weekly trends, heatmap data
│   ├── leetcode/                     # Sync, client wrapper, analysis (tag stats, weakness, suggestions)
│   ├── seed/                         # System design + behavioral seed data
│   └── generated/prisma/             # Prisma client output (gitignored)
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   ├── migrations/
│   └── dev.db                        # gitignored
└── docs/                             # This tree
```

## Request Flow

Almost every page is a **server component** that does its own DB calls via the shared Prisma client from [lib/db.ts](../../lib/db.ts). Interactive bits (forms, charts, the Excalidraw canvas, the interviewer chat) are **client components**, often wrapped via `next/dynamic({ ssr: false })` when they rely on browser-only APIs.

Mutations go through one of two paths:

1. **Server actions** (default) — colocated `actions.ts` files alongside the page. Used for everything the form can submit directly: saving notes, saving STAR answers, saving credentials, etc. Server actions revalidate the relevant paths after writes so subsequent navigations see fresh data.
2. **API routes** — only where we need a long-lived streaming response (the AI interviewer at [app/api/ai/interview/route.ts](../../app/api/ai/interview/route.ts)) or an externally-callable trigger (the sync route at [app/api/leetcode/sync/route.ts](../../app/api/leetcode/sync/route.ts)).

## Where Data Lives

All data is in `prisma/dev.db`, a SQLite file. The path is `gitignored`. There's no remote DB and no auth layer — the app assumes a single trusted user on a single machine.

### SQLite path quirk

Prisma's SQLite URL is resolved relative to the directory containing `schema.prisma`, **not** the runtime CWD. With a naïve `DATABASE_URL=file:./dev.db` the Next.js runtime can't find the file. The workaround in [lib/db.ts](../../lib/db.ts) is to pass an absolute `file:` URL into the `PrismaClient` constructor, computed via `path.resolve(process.cwd(), "prisma", "dev.db")`. [prisma.config.ts](../../prisma.config.ts) does the same for CLI commands so both contexts agree on the same file.

## Related

- [Data Model](data-model.md) — what's stored in `prisma/dev.db`.
- [Design System](design-system.md) — UI conventions used across every page.
- [Credentials & Privacy](credentials-and-privacy.md) — where API keys and session cookies live.
