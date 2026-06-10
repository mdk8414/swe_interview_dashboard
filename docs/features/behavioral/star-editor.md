# STAR Editor

*An autosaving form with four labeled textareas — Situation, Task, Action, Result — for one behavioral question. Plus a list view that shows progress per category and per-question status badges.*

## Why

STAR is the conventional structure for behavioral interview answers. The editor enforces the structure (four fields, not one big blob) so you can't trail off without addressing all four parts. Autosave means you can iterate on an answer over multiple sessions without ever clicking "Save."

## List view (`/behavioral`)

Categories are accordion items, sorted alphabetically. Each summary row shows:

- Category name (with a rotating chevron via the `[&::-webkit-details-marker]:hidden` + `group-open:rotate-90` pattern).
- An amber progress bar (`answered / total` for that category).
- A monospace `answered / total` count.

Inside each category, every question is a row that links to its detail page. The row shows the question text and a colored status badge:

- **Unanswered** (zinc): no answer row, or all four STAR fields empty.
- **Drafted** (amber): 1–3 STAR fields filled.
- **Polished** (emerald): all 4 STAR fields filled.

This is the only place in the app where Drafted/Polished use amber/emerald to signal a binary "good enough" state — it's intentional reuse of the brand palette in a semantically meaningful way.

By default, categories with at least one unanswered question are expanded; fully-answered categories collapse. The `open={answered < total}` prop on `<details>` does this in the initial render; the user can override per category and the override sticks for the page lifetime.

## Editor (`/behavioral/[id]`)

A vertical stack of fields, with a header showing the category name (amber eyebrow) and the question text. Above the fields, a progress bar (`filled / 4 · saved {time}`) gives constant visibility into autosave state.

Each field is a labeled `<textarea>` with a placeholder hint:

| Field | Hint |
|---|---|
| Situation | Set the scene. What was happening, when, where? |
| Task | What was your specific responsibility or goal? |
| Action | What did YOU do? Use 'I', not 'we', and be concrete. *(6 rows by default)* |
| Result | What changed? Quantify if possible. |

Plus an optional `Project tag` text input below the four — free-form, intended for the planned v2 project↔question mapper.

### Autosave

Built in [app/behavioral/[id]/StarForm.tsx](../../../app/behavioral/[id]/StarForm.tsx). Every keystroke schedules a `saveAnswer` server action via a 700ms debounce. Server-side `saveAnswer` does an upsert (find first by `questionId`, update or create) and revalidates the list page so navigating back shows current state.

The progress bar at the top reflects current local state (number of fields with any non-empty content). The "Saved {time}" indicator updates after each successful server action.

### Empty-string defaults

`BehavioralAnswer.situation / task / action / result` all have `@default("")` in the schema. This means the upsert path never has to handle nullable strings — the four fields are always strings, always defined, and the "is it answered?" check is just `field.length > 0`.

## Design decisions

- **Four separate fields**, not one freeform textarea. The structure is the point — if you wanted to write a paragraph you wouldn't need this tool.
- **Autosave only**, no Save button. Save buttons let users defer commit and then lose work. Autosave is industry-default for editor experiences (Google Docs, Notion, etc.).
- **Project tag is free-text**, not a dropdown. Users haven't catalogued their projects anywhere else in the app, so there's nothing to dropdown from. The v2 mapper will normalize tags across answers when it ships.
- **Status logic is "filled fields"**, not content quality. The app doesn't AI-judge your answer (yet). "Polished" means structurally complete, not narratively complete.

## Key files

- [app/behavioral/page.tsx](../../../app/behavioral/page.tsx) — list view (accordion + status badges + progress bars).
- [app/behavioral/[id]/page.tsx](../../../app/behavioral/[id]/page.tsx) — editor page (server component, fetches the question + existing answer).
- [app/behavioral/[id]/StarForm.tsx](../../../app/behavioral/[id]/StarForm.tsx) — client component, debounced autosave + progress bar.
- [app/behavioral/[id]/actions.ts](../../../app/behavioral/[id]/actions.ts) — `saveAnswer` server action.
- [lib/seed/behavioral.ts](../../../lib/seed/behavioral.ts) — the seeded question bank.
- [prisma/seed.ts](../../../prisma/seed.ts) — applies the seed.

## Related

- [Data Model](../../architecture/data-model.md) — `BehavioralCategory`, `BehavioralQuestion`, `BehavioralAnswer`.
- [Dashboard](../dashboard.md) — uses the same status logic to compute "weakest categories" for the Behavioral summary card.
