import Link from "next/link";
import { db } from "@/lib/db";
import { ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SystemDesignList() {
  const problems = await db.systemDesignProblem.findMany({
    include: { _count: { select: { diagrams: true } } },
    orderBy: { title: "asc" },
  });

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-500 mb-2">
          System Design
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Problems</h1>
        <p className="text-zinc-500 mt-1">
          Classic problems with notes and saved Excalidraw diagrams.
        </p>
      </div>

      <ul className="rounded-2xl bg-white dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800 ring-1 ring-zinc-900/5 dark:ring-white/5 shadow-sm shadow-zinc-900/5 dark:shadow-black/40 divide-y divide-zinc-100 dark:divide-zinc-800/70 overflow-hidden">
        {problems.map((p) => (
          <li key={p.id}>
            <Link
              href={`/system-design/${p.slug}`}
              className="group flex items-center justify-between px-5 py-4 hover:bg-amber-50/40 dark:hover:bg-amber-500/5 transition"
            >
              <div className="min-w-0">
                <div className="font-medium group-hover:text-amber-700 dark:group-hover:text-amber-300 transition">
                  {p.title}
                </div>
                <div className="text-xs text-zinc-500 mt-1 line-clamp-1">
                  {p.prompt}
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-500 shrink-0 ml-4">
                <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800/70 text-zinc-600 dark:text-zinc-400">
                  {p._count.diagrams} diagram{p._count.diagrams === 1 ? "" : "s"}
                </span>
                <ChevronRight
                  size={16}
                  className="text-zinc-400 group-hover:text-amber-500 transition"
                />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
