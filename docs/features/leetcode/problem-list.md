# Problem List

*A server-rendered table of every LeetCode problem in your synced catalog. Sort, filter, and click out to leetcode.com. State lives entirely in the URL so deep links work.*

## Why

You can find any problem in the catalog without leaving the app, see at a glance whether you've solved it, and click straight through to LeetCode to start it. Combined with the gap-analysis filters (`?tag=heap&status=untouched`), this becomes the primary "what should I do next" surface for users who want more agency than the dashboard's single suggestion.

## Behavior

### Layout

Six columns: **#**, **Title**, **Difficulty**, **Tags**, **Status**, and an unlabeled column for the "Open" link. All except Tags are sortable.

### Filtering

A form with four filters: free-text **title search** (`q`), **difficulty** dropdown (Easy/Medium/Hard), **status** dropdown (Solved/Untouched), and **tag** dropdown (populated from the visible set). Submitting the form navigates with the params in the URL. A **Reset** link clears all filters.

Title search and difficulty filter happen in Prisma. The tag filter uses a SQL `contains` against the JSON-encoded tags string (works because tags are stored as `"[\"array\",\"dp\"]"`-style JSON). The status filter happens **post-fetch in JS**, because "solved" depends on the joined submission count and the catalog returns up to 500 rows; filtering 500 in memory is cheaper than a join across all submissions.

### Sorting

Sort key (`id` | `title` | `difficulty` | `status`) and direction (`asc` | `desc`) live in the URL. Each sortable column header is a `<Link>` that:

- If clicked while active, toggles direction.
- If clicked while inactive, applies that column's sensible default direction (alphabetical asc for Title, count desc for everything else, but ascending by id by default).

Difficulty sorts by rank (Easy=1, Medium=2, Hard=3) with `id` as tiebreaker. Status sorts by solved-or-not boolean with `id` as tiebreaker. Tags isn't sortable — a tag is a list, there's no obvious correct ordering.

### Filter ↔ sort interaction

The filter form has hidden inputs for `sort` and `dir` so submitting filters doesn't drop the current sort. Conversely, the sort links preserve all current filter params.

### Responsive Tags column

The Tags column progressively reveals more tags as the viewport widens:

| Viewport | Tags shown |
|---|---|
| ≥ 1280px (xl) | 3 tags + `+N` count |
| 1024–1279px (lg) | 2 tags + `+N` |
| 768–1023px (md) | 1 tag + `+N` |
| < 768px (sm) | Column hidden entirely |

The `+N` recalculates correctly at each step. The table itself has `min-w-[560px]` with `overflow-x-auto` on its wrapper as a safety net for very narrow viewports.

### Status semantics

- **Solved** = at least one `LeetCodeSubmission` with `status === "ACCEPTED"` for the problem.
- **Untouched** = zero submissions.
- A row shows `✓ Solved` in emerald (the one semantic emerald accent on this page) or `—` in muted grey.

The synthetic `ACCEPTED` submission created at sync time (when LeetCode marks the problem as solved but no real submission row has been pulled yet) counts here — so "Solved" reflects LeetCode's truth even before submission history fully syncs.

## Design decisions

- **URL-based state** — matches the existing form pattern, makes filter+sort combinations shareable as links, and works without client JS for filtering. The cost is a navigation per filter change.
- **Tags not sortable** — a "sort by tag" interaction would be ambiguous (sort by first tag? alphabetical first tag? tag count?). Filter-by-tag covers the actual use case.
- **Drop Tags before scrolling** — at narrow widths, the table would otherwise need horizontal scroll to show all six columns. Tags is the lowest-signal column (already truncated to 3 tags), so it drops first.

## Key files

- [app/leetcode/page.tsx](../../../app/leetcode/page.tsx) — the page (server component) with the filter form, sort headers, and the table.

## Related

- [Stats & gap analysis](stats-and-gap-analysis.md) — the page that links here with pre-applied filters (`?tag=...&status=untouched`).
- [Sync & credentials](sync-and-credentials.md) — how the catalog gets populated.
