# Behavioral Module

*A curated bank of common STAR (Situation / Task / Action / Result) questions grouped by category, with a per-question editor that autosaves as you type.*

The question bank is seeded from [lib/seed/behavioral.ts](../../../lib/seed/behavioral.ts) — ~30 questions across 10 categories (Leadership, Conflict, Failure, Impact, Teamwork, Ambiguity, Prioritization, Disagreement, Learning, CustomerFocus). The categories are intentional buckets, not derived from the questions.

The module has two routes:

| Route | Purpose | Doc |
|---|---|---|
| `/behavioral` | Accordion of categories with progress bars + status badges | [star-editor.md](star-editor.md) (covers both) |
| `/behavioral/[id]` | STAR answer editor for one question | [star-editor.md](star-editor.md) |

## Related

- [Data Model](../../architecture/data-model.md) — `BehavioralCategory`, `BehavioralQuestion`, `BehavioralAnswer`.
- [Dashboard](../dashboard.md) — the Behavioral summary card surfaces the top 3 weakest categories.
