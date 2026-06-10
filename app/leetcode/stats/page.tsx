import Link from "next/link";
import { ExternalLink, ArrowRight } from "lucide-react";
import { tagStats, difficultyBreakdown, suggestProblems } from "@/lib/leetcode/analysis";
import { CategoryChart, DifficultyChart } from "@/components/CategoryChart";
import { GapAnalysisTable } from "@/components/GapAnalysisTable";

export const dynamic = "force-dynamic";

const PANEL =
  "rounded-2xl p-5 bg-white dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800 ring-1 ring-zinc-900/5 dark:ring-white/5 shadow-sm shadow-zinc-900/5 dark:shadow-black/40";

function PageHeader() {
  return (
    <div className="mb-8">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-500 mb-2">
        LeetCode
      </div>
      <h1 className="text-3xl font-semibold tracking-tight">Stats</h1>
      <p className="text-zinc-500 mt-1">
        Solve patterns, weak spots, and what to work on next.
      </p>
    </div>
  );
}

export default async function LeetCodeStats() {
  const [stats, diff, suggested] = await Promise.all([
    tagStats(),
    difficultyBreakdown(),
    suggestProblems(5),
  ]);

  const diffData = Object.entries(diff).map(([difficulty, v]) => ({
    difficulty,
    total: v.total,
    solved: v.solved,
  }));

  if (stats.length === 0) {
    return (
      <div className="max-w-6xl">
        <PageHeader />
        <div className="rounded-2xl p-10 text-center border border-dashed border-zinc-300 dark:border-zinc-700 bg-white/40 dark:bg-zinc-900/40">
          <p className="text-zinc-500 mb-4">No data yet — sync your LeetCode account first.</p>
          <Link
            href="/leetcode/settings"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-b from-amber-400 to-amber-500 text-zinc-950 shadow-sm shadow-amber-500/40 hover:from-amber-300 hover:to-amber-400 transition"
          >
            Go to settings <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <PageHeader />

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3">Solved by tag</h2>
        <div className={PANEL}>
          <CategoryChart data={stats} />
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3">Solved by difficulty</h2>
        <div className={PANEL}>
          <DifficultyChart data={diffData} />
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-1">Gap analysis</h2>
        <p className="text-sm text-zinc-500 mb-3">
          Weakness ∈ (0, 1] = 1 ÷ (1 + difficulty-weighted solves), with weights 0.5·easy, 1·medium, 1.5·hard.
          1 = nothing solved in this tag; approaches 0 as you solve more.
        </p>
        <GapAnalysisTable stats={stats} />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Suggested next problems</h2>
        {suggested.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Nothing to suggest yet — solve a few problems to seed the recommender.
          </p>
        ) : (
          <ul className="rounded-2xl bg-white dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800 ring-1 ring-zinc-900/5 dark:ring-white/5 shadow-sm shadow-zinc-900/5 dark:shadow-black/40 divide-y divide-zinc-100 dark:divide-zinc-800/70 overflow-hidden">
            {suggested.map((p) => (
              <li
                key={p.id}
                className="px-4 py-3 flex items-center justify-between hover:bg-amber-50/40 dark:hover:bg-amber-500/5 transition"
              >
                <div>
                  <span className="font-medium">{p.title}</span>{" "}
                  <span className="text-xs text-zinc-500">· {p.difficulty}</span>
                </div>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400 transition"
                >
                  Open <ExternalLink size={12} />
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
