# Workspace

*The per-problem page at `/system-design/[slug]`. Three regions: a fixed prompt panel at the top-left, a tabbed left panel (Notes / Interviewer / History) below it, and a full-height Excalidraw canvas on the right with multi-diagram tabs. When a snapshot is selected from the History tab, the right column swaps to a read-only image view in place of the canvas.*

## Why

System design practice happens across three modalities: reading the prompt, thinking in text (notes / estimates), and thinking visually (architecture diagrams). The workspace lays out all three in one view so you don't lose context switching tabs. Adding the interviewer behind a tab toggle (rather than a fourth region) means it doesn't cost screen real estate when you're not using it.

## Layout

A 12-column grid that fills the viewport below the page header (`h-[calc(100vh-9rem)]`):

- **Left column (4/12)**:
  - **Prompt panel** at the top — read-only, displays the seeded problem prompt with a thin amber gradient strip across the top.
  - **Tab switcher** (`Notes` / `Interviewer` / `History`) — small pill buttons styled like the rest of the app's active/inactive amber pattern. History also shows a snapshot-count badge.
  - **Tab content** below the switcher — either the notes textarea, the [InterviewerPanel](../../../components/InterviewerPanel.tsx), or the [HistoryPanel](../../../components/HistoryPanel.tsx). All three are mounted simultaneously and hidden via CSS so state (chat history, draft input, scroll position, in-progress rename) persists across tab switches.
- **Right column (8/12)**:
  - **Default mode** (no snapshot selected): Diagram tab bar at the top (one tab per `Diagram` row plus a "New diagram" button); Excalidraw canvas below.
  - **Snapshot view mode** (a snapshot is selected from the History tab): the diagram tab bar and Excalidraw are hidden; a static PNG image takes the full panel with a Read-only badge. Clicking Notes or Interviewer exits this mode and the canvas reappears with the previously-active diagram tab intact.

## Notes editor

A plain `<textarea>` with the standard form-field treatment. Saves through the `saveNotes(slug, notes)` server action ([app/system-design/[slug]/actions.ts](../../../app/system-design/[slug]/actions.ts)) on every keystroke, wrapped in `useTransition` so the UI stays responsive. There's no debounce — each keystroke writes to the DB. Cheap because SQLite is on disk and the page is local-only.

## Diagrams

Each `Diagram` row holds the full Excalidraw scene as a JSON string in `sceneJson`. The component at [components/ExcalidrawCanvas.tsx](../../../components/ExcalidrawCanvas.tsx):

- Loads via `next/dynamic({ ssr: false })` — Excalidraw uses browser-only APIs.
- Builds an `initialData` object from `sceneJson` (parses elements / appState / files; replaces the missing `collaborators` Map).
- Subscribes to Excalidraw's `onChange`, serializes the scene to JSON (dropping any `Map` values), and writes through a debounced `saveDiagram(diagramId, sceneJson)` server action every 800ms.
- On unmount, flushes the last serialized scene (so navigating away doesn't lose recent edits).
- Exposes an `exportPng()` method via the new React 19 ref-as-prop pattern. Lazy-imports `exportToBlob` from `@excalidraw/excalidraw`, runs it against the current scene, returns base64 (no `data:` prefix), or `null` if the canvas is empty. Used by the AI Interviewer.

### Multi-diagram tabs

Each problem can have multiple diagrams labeled `v1`, `v2`, ... (auto-numbered on create). The tab bar is purely a UI affordance over the existing `Diagram` model — tabs map 1:1 to rows. Click switches the active diagram; the `New diagram` button creates a fresh row via `createDiagram`; the delete button on hover removes one via `deleteDiagram`.

## Design decisions

- **Tabbed left panel** rather than a separate "Interviewer" route — the interviewer needs to see the current diagram (via `exportPng()`), so it has to share the workspace. Tabs keep the canvas at full size.
- **No debounce on notes**, **debounce on diagrams** — notes are small text writes; diagrams can be hundreds of elements and serializing each keystroke is wasteful. The unmount flush covers the "last edits lost" case for diagrams.
- **Lazy-import `exportToBlob`** rather than top-level import — `@excalidraw/excalidraw` has client-only dependencies that crash on the SSR pass. The component itself is dynamic for the same reason; the export utility is imported only when the user actually calls `exportPng()` (always in a client context).
- **`onDelete: Cascade` on `Diagram.problem`** — deleting a problem (not currently exposed in UI but possible via Prisma Studio) cleans up its diagrams.

## Key files

- [app/system-design/[slug]/page.tsx](../../../app/system-design/[slug]/page.tsx) — server page that fetches problem + diagrams + conversation and passes them to the workspace.
- [app/system-design/[slug]/DesignWorkspace.tsx](../../../app/system-design/[slug]/DesignWorkspace.tsx) — client component, owns tab state, the canvas ref, the diagram tab bar, and orchestrates the snapshot path to the interviewer.
- [app/system-design/[slug]/actions.ts](../../../app/system-design/[slug]/actions.ts) — `saveNotes`, `saveDiagram`, `createDiagram`, `deleteDiagram`, `resetConversation`.
- [components/ExcalidrawCanvas.tsx](../../../components/ExcalidrawCanvas.tsx) — the wrapped Excalidraw editor + PNG export.

## Related

- [AI Interviewer](ai-interviewer.md) — the other half of the workspace.
- [Snapshots](snapshots.md) — the History tab and snapshot-review mode.
- [Data Model](../../architecture/data-model.md) — `SystemDesignProblem`, `Diagram`.
