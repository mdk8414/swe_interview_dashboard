# Sweatshirt Documentation

Sweatshirt is a local, single-user web app for SWE interview prep across three streams: LeetCode practice, system design diagramming, and behavioral (STAR) answers. It runs entirely on `localhost`, stores all data in a local SQLite database, and uses the user's own credentials (LeetCode session cookie, Anthropic API key) for any external calls.

This `docs/` tree exists so that any future contributor — human or AI — can understand each feature without having to read every source file in the module. The top-level [README.md](../README.md) covers user-facing setup; [CLAUDE.md](../CLAUDE.md) covers architecture at a glance. This tree covers everything in between.

## Where to start

1. **New to the codebase?** Read [architecture/overview.md](architecture/overview.md) first. It explains the stack, the file layout, and how data flows from a request to the DB and back.
2. **Trying to extend or debug a specific feature?** Jump straight to the relevant feature doc under [features/](features/).
3. **Adding a new feature or modifying an existing one?** Read [conventions/documentation.md](conventions/documentation.md) before you start — every change to the app should land with a corresponding doc update.

## Table of Contents

### Architecture

- [Overview](architecture/overview.md) — Stack, file layout, request flow, where data lives.
- [Data Model](architecture/data-model.md) — Every Prisma model with purpose and key relationships.
- [Design System](architecture/design-system.md) — Amber accent, depth tokens, layout patterns.
- [Credentials & Privacy](architecture/credentials-and-privacy.md) — How secrets are stored and the trust model.

### Features

- [Dashboard](features/dashboard.md) — Greeting, summary cards, today's focus, activity heatmap, recent activity.

- **LeetCode** ([overview](features/leetcode/README.md))
  - [Problem list](features/leetcode/problem-list.md) — Sortable, filterable table with responsive tags column.
  - [Stats & gap analysis](features/leetcode/stats-and-gap-analysis.md) — Charts, weakness formula, suggestions.
  - [Sync & credentials](features/leetcode/sync-and-credentials.md) — Cookie-based auth and the sync flow.

- **System Design** ([overview](features/system-design/README.md))
  - [Workspace](features/system-design/workspace.md) — Prompt panel, notes/interviewer/history tabs, multi-diagram canvas.
  - [AI Interviewer](features/system-design/ai-interviewer.md) — Claude Sonnet 4.6 chat with vision over the current diagram.
  - [Snapshots](features/system-design/snapshots.md) — Capture and review point-in-time transcript + diagram pairs.

- **Behavioral** ([overview](features/behavioral/README.md))
  - [STAR editor](features/behavioral/star-editor.md) — Category-grouped questions with autosaving Situation/Task/Action/Result form.

### Conventions

- [Documentation](conventions/documentation.md) — How to keep this tree in sync with the code.
