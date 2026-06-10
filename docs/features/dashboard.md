# Dashboard

*The dashboard is a prompt to act, not a status board. Every section pushes toward "do something next" — a focused pick per module, a momentum visualization, the threads you already started — with the summary cards as supporting context.*

## Why

Without the dashboard, every session starts with "what should I work on?" The dashboard answers that question in five passes (greeting → cards → focus → activity → recent), each at a different granularity. The user should be able to land on `/` and be moving inside ten seconds.

## Sections (in render order)

### 1. Greeting hero

Top of the page. Amber eyebrow ("SWEATSHIRT") + time-aware greeting (`"Good morning."` / `"Burning the midnight oil"`) + one-sentence subtitle. The greeting is derived from `new Date().getHours()` in [app/page.tsx](../../app/page.tsx) — there are five buckets: pre-dawn, morning, afternoon, evening, late.

### 2. Three summary cards

`LeetCode`, `System Design`, `Behavioral`. Each is a clickable [Card](../../components/Card.tsx) (links to the module list) with an amber accent strip across the top.

- **LeetCode card**: big amber number (`X solved`), "Y accepted in last 7 days", **top 3 weakest tags** as a list with amber progress bars (`solved / total` and a width = ratio). If `solved === 0`, shows an amber prompt to set up sync.
- **System Design card**: big amber number (`N problems`), `M diagrams saved`.
- **Behavioral card**: big amber number (`A / Q answered`), **top 3 weakest categories** with amber progress bars (`answered / total`).

Each card ends with a **12-week amber sparkline** showing per-week activity for that module. Sparkline = [components/Sparkline.tsx](../../components/Sparkline.tsx), a small `recharts AreaChart` with no axes/grid/tooltip and an amber gradient fill.

The weak-spots are reused from the same data the gap analysis and behavioral-list code use — see [LeetCode stats](leetcode/stats-and-gap-analysis.md) for the LeetCode weakness formula.

### 3. Today's Focus

Three tiles side-by-side, **one suggestion per module**. Clicking any tile navigates to its destination. Built in [components/TodaysFocus.tsx](../../components/TodaysFocus.tsx), data assembled by [lib/dashboard/focus.ts](../../lib/dashboard/focus.ts) via `getTodaysFocus()`.

The pickers:

- **LeetCode** — `suggestProblems(1)` from [lib/leetcode/analysis.ts](../../lib/leetcode/analysis.ts). Falls back to a "Set up sync" prompt if no credentials are configured.
- **Behavioral** — finds the category with the lowest `answered / total` ratio, then picks the first unanswered question in it.
- **System Design** — picks the problem with the oldest "last touched" timestamp (`max(problem.updatedAt, latest_diagram.updatedAt)`), so problems you've ignored longest surface first.

Each tile is either a "ready" variant (amber pill CTA + title + subtitle) or an "empty" variant (dashed border + setup prompt).

### 4. Activity Heatmap

Three GitHub-style heatmap rows stacked vertically, one per module. Each row: 84 cells laid out as 12 columns × 7 rows (column-major: leftmost column = oldest week, today is in the rightmost column). Cells are color-coded amber by intensity bucket (0 / 1 / 2-4 / 5+ daily actions); the hottest bucket has a soft amber glow shadow.

- **LeetCode** activity = accepted submissions on that day.
- **System Design** activity = diagram edits + notes edits.
- **Behavioral** activity = STAR answer edits on non-empty answers.

Each cell has a `title` attribute so hovering shows `"YYYY-MM-DD · N {module} actions"`. Built in [components/ActivityHeatmap.tsx](../../components/ActivityHeatmap.tsx), data assembled by [lib/dashboard/activity.ts](../../lib/dashboard/activity.ts) via `getActivityByDay(84)`.

### 5. Continue Where You Left Off

A merged feed of the most recent activity across all modules (default top 6). Each row shows the module icon, a short type label (LeetCode / Diagram / Notes / Behavioral), the item title, and a "time ago" string. Clicking goes to the item's detail page; LeetCode rows also have a small external-link icon to open the problem on leetcode.com.

Built in [components/RecentActivity.tsx](../../components/RecentActivity.tsx), data assembled by [lib/dashboard/recent.ts](../../lib/dashboard/recent.ts) via `getRecentActivity(6)`. The helper queries four sources in parallel (submissions, diagrams, system-design notes, behavioral answers), filters out empty-content rows, merges them, sorts by recency, and slices.

If everything is empty (fresh install), an empty-state message replaces the list.

## Design decisions

- **Always-3 focus**, not "smart" — predictable beats clever. You get exactly one thing per module, every time. Easier to scan, easier to ignore the module you're not working on today.
- **Heatmap rows stacked separately** rather than blended into one row — at the user's explicit ask. The trade-off is more vertical space; the gain is per-module visibility (you can tell at a glance that you've been doing lots of LeetCode but no behavioral).
- **Amber everywhere on the dashboard**, including the weak-spot progress bars and the heatmap intensity — even though "more solved = better" might semantically argue for emerald. The dashboard is the most "marketing-y" surface; visual cohesion wins over strict semantics. Emerald is reserved for in-context "Solved" badges on the problem list.
- **Sparkline rather than full chart on the cards** — the cards already carry primary numbers; a sparkline is just a momentum cue, not a precision instrument. Tiny by design.

## Key files

- [app/page.tsx](../../app/page.tsx) — orchestrates the data fetch and renders all five sections.
- [components/Sparkline.tsx](../../components/Sparkline.tsx), [components/ActivityHeatmap.tsx](../../components/ActivityHeatmap.tsx), [components/TodaysFocus.tsx](../../components/TodaysFocus.tsx), [components/RecentActivity.tsx](../../components/RecentActivity.tsx) — section components.
- [lib/dashboard/focus.ts](../../lib/dashboard/focus.ts), [lib/dashboard/activity.ts](../../lib/dashboard/activity.ts), [lib/dashboard/recent.ts](../../lib/dashboard/recent.ts) — data assembly.

## Related

- [LeetCode stats](leetcode/stats-and-gap-analysis.md) — the source of the LeetCode card's "weakest tags" data and weakness formula.
- [Design System](../architecture/design-system.md) — the amber/emerald rules + surface tokens used here.
