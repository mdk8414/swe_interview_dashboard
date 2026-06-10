# Interview Snapshots

*Capture a point-in-time record (transcript text + diagram PNG) during a system design interview, browse saved snapshots in a History tab, and review them in a read-only view that swaps the transcript into the left panel and the diagram image into the right panel.*

## Why

Without snapshots, the user has the live conversation in the Interviewer tab and the live canvas on the right — but no way to look back at "what did my design look like when the interviewer challenged my caching choice?" Snapshots are deliberate save-points: the user clicks a button to mint one, then can revisit it any time. They survive interview restart so a fresh start doesn't wipe the record of prior attempts.

## Behavior

### Capturing

A **Save snapshot** button appears in the [InterviewerPanel](../../../components/InterviewerPanel.tsx) header, next to the **Restart** button, only after at least one message exists. Clicking it:

1. Calls the workspace's `getSnapshot()` to ask the Excalidraw canvas for a PNG of the current scene (returns `null` if the canvas is empty).
2. Formats the chat transcript via `formatTranscript()` ([lib/ai/snapshot.ts](../../../lib/ai/snapshot.ts)) — a plain-text rendering with a header and one block per turn.
3. Calls the `saveSnapshot` server action to persist a new `DesignSnapshot` row.
4. Optimistically appends the new snapshot to the workspace's local list so the History tab shows it immediately.
5. The button briefly flips to a green "Saved" check, then back to the camera icon.

### History tab

A third tab — **History** — sits next to Notes and Interviewer. Its tab button shows a badge with the snapshot count.

The History tab has two modes:

- **List** (default): newest-first list of snapshots. Each row shows the snapshot name (or the timestamp if unnamed), a relative time string (`2h ago`), and the auto-subtitle (`5 messages · v2`). Hovering reveals a small pencil (inline rename — Enter commits, Esc cancels) and a trash icon (with confirm). Empty state: a dashed-border card with a one-line prompt to capture from the Interviewer.
- **Detail**: shown after selecting a snapshot. A back link, the snapshot's name + timestamp + subtitle, a `Read-only` badge, and the full transcript rendered as preformatted text in the same surface treatment as the chat transcript.

### Snapshot view (right panel)

When a snapshot is selected, the right column transforms:

- The Excalidraw canvas and its diagram tab bar are hidden.
- A static image viewer takes over: the snapshot's PNG rendered with `object-contain` to preserve aspect ratio, with a header eyebrow showing "Snapshot · {timestamp} · {diagram label}" and a `Read-only` badge.
- If the snapshot was captured with an empty canvas, the viewer shows a "No diagram captured" placeholder instead.

### Exiting snapshot view

Two ways:

- **Back to history** link inside the snapshot detail returns to the History list. The canvas remains hidden (you're still on the History tab).
- Clicking the **Notes** or **Interviewer** tab clears `activeSnapshotId` and reactivates the canvas with whichever diagram tab was last selected.

### Survives Restart

The "Restart interview" button in the Interviewer deletes the conversation and its messages, but **snapshots remain**. They're scoped to the problem, not to the conversation. This is deliberate: snapshots are the durable record of how the user reasoned through the problem; the live conversation is ephemeral working state.

## Data model

```prisma
model DesignSnapshot {
  id           String              @id @default(cuid())
  problemId    String
  problem      SystemDesignProblem @relation(fields: [problemId], references: [id], onDelete: Cascade)
  name         String?             // optional user-given name
  transcript   String              // formatted text of chat at save time
  diagramPng   String?             // base64 PNG (no "data:" prefix); null if canvas was empty
  diagramLabel String?             // which diagram tab was active when captured
  messageCount Int                 @default(0)
  createdAt    DateTime            @default(now())

  @@index([problemId, createdAt])
}
```

Snapshots cascade-delete when the `SystemDesignProblem` is deleted. They do **not** cascade-delete with the `DesignConversation`.

PNG is stored inline as base64 — modest size for typical diagrams (~50-500KB), and keeps everything in one SQLite file consistent with the rest of the app's local-only philosophy.

## Design decisions

- **Manual capture, not auto.** Auto-snapshotting on every assistant turn would bloat storage and clutter the History list with mostly-identical states. Manual lets the user mark intentional save-points.
- **PNG, not the Excalidraw scene JSON.** The snapshot is a *record*, not an editable working state — the user wants to see what they had, not to fork from it. PNG is the format that matches that intent and matches what the AI interviewer also sees on each turn.
- **In-app viewing only (v1).** No download buttons; everything stays in the SQLite DB. Adding download is a small follow-up if needed.
- **Auto-timestamp with optional rename.** Naming at capture time would add friction to a button that should feel instant; renaming later (and rarely) is the right tradeoff.
- **Cascade on problem, not on conversation.** Snapshots survive `Restart interview`. The user explicitly chose this — snapshots are the persistent record.
- **All three left-panel tabs stay mounted via CSS `hidden`**, same pattern as Notes ↔ Interviewer. Switching tabs preserves the History list scroll position, snapshot draft renames in progress, etc.

## Key files

- [prisma/schema.prisma](../../../prisma/schema.prisma) — `DesignSnapshot` model + back-pop on `SystemDesignProblem.snapshots`.
- [lib/ai/snapshot.ts](../../../lib/ai/snapshot.ts) — `formatTranscript()` helper.
- [app/system-design/[slug]/actions.ts](../../../app/system-design/[slug]/actions.ts) — `saveSnapshot`, `renameSnapshot`, `deleteSnapshot` server actions.
- [components/HistoryPanel.tsx](../../../components/HistoryPanel.tsx) — list + detail modes.
- [components/InterviewerPanel.tsx](../../../components/InterviewerPanel.tsx) — Save snapshot button + capture flow.
- [app/system-design/[slug]/DesignWorkspace.tsx](../../../app/system-design/[slug]/DesignWorkspace.tsx) — third tab, `activeSnapshotId` state, right-panel branching, inline `SnapshotImageView`.
- [app/system-design/[slug]/page.tsx](../../../app/system-design/[slug]/page.tsx) — fetches snapshots and passes them down.

## Related

- [Workspace](workspace.md) — the three-tab layout this feature extends.
- [AI Interviewer](ai-interviewer.md) — the source of the transcript and the home of the Save button.
- [Data Model](../../architecture/data-model.md) — the `DesignSnapshot` row in the schema walkthrough.
