# Stats & Gap Analysis

*Charts and tables that surface where you're weak. The weakness score is the key concept — it treats "10 array problems solved" and "10 heap problems solved" as equivalently strong regardless of how big each tag is.*

## Why

Just knowing your solved count doesn't tell you what to do next. The stats page answers three different "where am I weak" questions: which tags have I touched least (chart + gap table), which difficulties am I avoiding (chart), and what specific problems should I try (suggestions list).

## The page (`/leetcode/stats`)

Four sections, top to bottom:

1. **Solved by tag** — Horizontal bar chart (top 18 tags). Each bar's amber section is your solved count. A toggle in the upper right ("Show total available") adds a gray bar for the catalog total; default is off so the Y-axis scales to your progress instead of the catalog size.
2. **Solved by difficulty** — Same toggle, three bars (Easy / Medium / Hard).
3. **Gap analysis table** — The main attraction. See below.
4. **Suggested next problems** — Top 5 unsolved free problems ranked by the suggestion algorithm.

If no data is synced yet, the page replaces all of this with a dashed empty state + amber CTA pointing to settings.

## Gap analysis table

Per-tag breakdown with the following columns: **Tag** | **Solved / Total** | **Weakness**. A toggle ("Show E/M/H breakdown") adds three extra columns (Easy / Medium / Hard) between Solved/Total and Weakness; when collapsed, hovering Solved/Total shows the same breakdown in a tooltip.

Sortable on every column (default: Weakness desc — weakest tags first). Paginated at 25 rows per page; sort or breakdown toggle resets to page 1.

Each tag links to the problem list with `?tag=<tag>&status=untouched` pre-applied, so clicking it drops you straight into "show me the unsolved problems for this tag."

### The weakness formula

```
strength = 0.5 · easySolved + 1.0 · mediumSolved + 1.5 · hardSolved
weakness = 1 / (1 + strength)
```

Weakness ∈ (0, 1]. **1** = nothing solved in this tag. As you solve more, weakness asymptotically approaches 0 but never reaches it.

#### Why this shape

The formula went through a few iterations:

- **First attempt: `weakness = (total - solved) × difficultyWeight`** — penalized engaging with tags that happen to have many problems. Tag size dominated the ranking.
- **Second attempt: `weakness = 1 - strength / maxPossible`** (the difficulty-weighted coverage ratio). Same problem — coverage-based scoring punished tags-with-lots-of-problems.
- **Third attempt: `weakness = 1 / strength` with a sentinel of 3 when strength = 0** — discontinuity. A tag with `strength = 0.1` scored `weakness = 10`, higher than the "untouched" sentinel of 3, so partially-touched tags looked weaker than fully-untouched ones.
- **Current: `weakness = 1 / (1 + strength)`** — smooth, bounded, no sentinels, and intentionally ignores tag size. The premise is "10 problems is 10 problems regardless of how big the tag is" — if you don't care about tag-size weighting, this is the cleanest formulation.

The formula lives in [lib/leetcode/analysis.ts](../../../lib/leetcode/analysis.ts).

## Suggested next problems

`suggestProblems(5)` in [lib/leetcode/analysis.ts](../../../lib/leetcode/analysis.ts). The algorithm:

1. Compute `tagStats()` and take the top 5 weakest tags into a set.
2. Fetch up to 200 candidate problems where `isPaid = false` and there's no accepted submission.
3. Score each candidate: +2 per weak-tag match in its tags, +1 if its acceptance rate is in `[0.3, 0.7]` (i.e. not a trivial gimme and not a notoriously hard outlier).
4. Sort by score descending, return the top N.

It's intentionally a simple heuristic — the goal is "give me five problems that aren't terrible picks," not a globally optimal study plan. A better v2 would factor in your recent solved-difficulty median (so a hard-only person doesn't get easy suggestions).

## Charts

[components/CategoryChart.tsx](../../../components/CategoryChart.tsx) holds both charts (`CategoryChart` and `DifficultyChart`). Both use `recharts` with:

- An amber gradient fill (`#fbbf24` → `#d97706`) on the "solved" bars via an SVG `linearGradient`.
- A translucent zinc fill on the optional "total" bars.
- A dark amber-bordered tooltip styled to match the rest of the UI.
- `allowDecimals={false}` on the Y-axis (it's a count).

## Key files

- [app/leetcode/stats/page.tsx](../../../app/leetcode/stats/page.tsx) — server page that fetches the data and renders sections.
- [lib/leetcode/analysis.ts](../../../lib/leetcode/analysis.ts) — `tagStats`, `difficultyBreakdown`, `suggestProblems`.
- [components/GapAnalysisTable.tsx](../../../components/GapAnalysisTable.tsx) — the interactive gap analysis table.
- [components/CategoryChart.tsx](../../../components/CategoryChart.tsx) — both bar charts.

## Related

- [Problem list](problem-list.md) — the destination of gap-analysis tag links.
- [Sync & credentials](sync-and-credentials.md) — what the stats need before they can compute anything useful.
- [Dashboard](../dashboard.md) — the dashboard card reuses `tagStats()` to surface the top 3 weakest tags.
