# Design System

*Amber is the primary brand accent; emerald is reserved for "completed/positive" semantics. Every page uses the same handful of surface, button, input, and layout tokens so the app feels consistent.*

There's no design-system library — every token is a Tailwind class string applied directly. Below are the canonical patterns. Search for any one of these strings in `components/` or `app/` to find a working example.

## Color semantics

| Role | Color family | Used for |
|---|---|---|
| **Brand accent / attention** | `amber-400` → `amber-600` | Big numbers, CTAs, active nav state, sparklines, heatmap intensity, hover borders, progress bars, sort-column active state. |
| **Success / completion** | `emerald-500` → `emerald-600` | "Solved" badge on the LeetCode list, "Polished" badge on Behavioral questions, save confirmations. |
| **Error** | `rose-500` → `rose-700` | Inline error messages, destructive hover (e.g. delete buttons). |
| **Difficulty** | `emerald` (Easy), `amber` (Medium), `rose` (Hard) | The three difficulty badges only. |
| **Neutral surface** | `zinc-*` | Backgrounds, borders, body text, muted labels. |

The rule of thumb: if it's a *highlight* (attention, action, intensity), use amber. If it represents *done* / *good* / *achieved*, use emerald.

## Surface tokens

The canonical card / panel treatment, used by [components/Card.tsx](../../components/Card.tsx), the gap analysis table, recent activity list, Today's Focus tiles, settings forms, and more:

```
rounded-2xl
bg-white dark:bg-zinc-900/70
border border-zinc-200/80 dark:border-zinc-800
ring-1 ring-zinc-900/5 dark:ring-white/5
shadow-sm shadow-zinc-900/5 dark:shadow-black/40
```

Layered fill (translucent dark mode) + hairline border + inner ring + soft shadow gives the depth you see on every panel. Interactive variants add:

```
hover:border-amber-300 dark:hover:border-amber-500/50
hover:shadow-md hover:-translate-y-0.5
transition duration-200
```

For accent panels (the settings cards, the prompt panel in the workspace, the dashboard summary cards), add a thin amber gradient hairline across the top:

```html
<span aria-hidden class="absolute inset-x-0 top-0 h-px
  bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />
```

## Buttons

**Primary** (Save, Filter, Send, Sync now):

```
inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold
bg-gradient-to-b from-amber-400 to-amber-500 text-zinc-950
shadow-sm shadow-amber-500/40
hover:from-amber-300 hover:to-amber-400
disabled:opacity-50 disabled:cursor-not-allowed
```

**Secondary** (Clear, Reset):

```
inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
border border-zinc-300 dark:border-zinc-700
hover:bg-zinc-100 dark:hover:bg-zinc-900
```

**Pill CTA** (used for "View stats", "Go" on Today's Focus, etc.):

```
inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold
bg-amber-500/10 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300
hover:bg-amber-500 hover:text-white dark:hover:bg-amber-400 dark:hover:text-zinc-950
transition
```

## Form inputs

```
rounded-xl
border border-zinc-200/80 dark:border-zinc-800
ring-1 ring-zinc-900/5 dark:ring-white/5
bg-white dark:bg-zinc-900/60
px-3 py-2.5
focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50
```

Smaller filter inputs (on the LeetCode list) use `rounded-lg` and `py-1.5` instead. See [app/leetcode/page.tsx](../../app/leetcode/page.tsx) for the canonical `FIELD` constant.

## Page hero

Every top-level page opens with the same hero pattern:

```html
<div class="mb-8">
  <div class="text-xs font-semibold uppercase tracking-[0.2em]
              text-amber-600 dark:text-amber-500 mb-2">
    SECTION NAME
  </div>
  <h1 class="text-3xl font-semibold tracking-tight">Page title</h1>
  <p class="text-zinc-500 mt-1">One-sentence subtitle.</p>
</div>
```

Sub-pages add a "← Back to ..." link above the eyebrow. The dashboard uses a `text-4xl` greeting instead of a fixed title.

## Layout primitives

**[components/Nav.tsx](../../components/Nav.tsx)** — sidebar nav. Active item: amber-tinted background, amber icon, amber-500 left rail accent. Brand mark: amber gradient tile with `Shirt` icon + "Sweatshirt" wordmark. Backdrop-blurred so the ambient glow shows through.

**[app/layout.tsx](../../app/layout.tsx)** — root shell. Fixed-position `<div>` behind everything renders two radial gradients (warm orange upper-right, softer amber lower-left), subtle in light mode and more visible in dark.

**[components/Card.tsx](../../components/Card.tsx)** — the canonical surface primitive. Wraps children in the surface tokens above, with an optional `accent` prop for the top hairline strip and an optional `href` prop that makes the whole card a `next/link`.

## Sortable table headers

A consistent pattern across the LeetCode list ([app/leetcode/page.tsx](../../app/leetcode/page.tsx)) and the gap analysis table ([components/GapAnalysisTable.tsx](../../components/GapAnalysisTable.tsx)):

- Inactive column: `text-zinc-500` with a faint `ArrowUpDown` icon (40% opacity).
- Active column: `text-amber-600 dark:text-amber-400` with `ArrowUp` or `ArrowDown`.
- Click toggles direction on the active column; clicking a different column applies that column's sensible default direction.

## Related

- [Architecture Overview](overview.md) — where the design tokens live in the file tree.
