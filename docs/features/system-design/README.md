# System Design Module

*A workspace per problem — read the prompt, take notes, draw Excalidraw diagrams in multiple revisions, and (optionally) run a live interview against Claude that can see your current diagram.*

System design problems are seeded into the DB on first run (URL Shortener, Twitter Timeline, Rate Limiter, etc.). There's no syncing — the catalog is intentional and curated.

The module has two routes:

| Route | Purpose | Doc |
|---|---|---|
| `/system-design` | List of seeded problems with diagram counts | (no dedicated doc — list view is trivial; see [Workspace](workspace.md) for context) |
| `/system-design/[slug]` | Per-problem workspace + AI interviewer | [workspace.md](workspace.md), [ai-interviewer.md](ai-interviewer.md) |

The sub-docs cover the workspace experience:

- [Workspace](workspace.md) — the prompt panel, notes editor, and multi-tab Excalidraw canvas.
- [AI Interviewer](ai-interviewer.md) — the Claude-backed chat that lives in the left panel and can see your diagram.
- [Snapshots](snapshots.md) — save and review point-in-time captures of the transcript + diagram.

## Related

- [Data Model](../../architecture/data-model.md) — `SystemDesignProblem`, `Diagram`, `DesignConversation`, `DesignMessage`, `DesignSnapshot`.
- [Credentials & Privacy](../../architecture/credentials-and-privacy.md) — `AICredential` setup for the interviewer.
- [Dashboard](../dashboard.md) — the System Design summary card and the "least recently touched" picker on Today's Focus.
