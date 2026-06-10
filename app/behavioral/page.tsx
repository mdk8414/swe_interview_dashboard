import Link from "next/link";
import { db } from "@/lib/db";
import { ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

function status(answers: { situation: string; task: string; action: string; result: string }[]) {
  const a = answers[0];
  if (!a) return "Unanswered";
  const filled = [a.situation, a.task, a.action, a.result].filter(Boolean).length;
  if (filled === 0) return "Unanswered";
  if (filled < 4) return "Drafted";
  return "Polished";
}

const STATUS_BADGE: Record<string, string> = {
  Unanswered: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800/70 dark:text-zinc-400",
  Drafted:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 ring-1 ring-amber-500/30",
  Polished:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 ring-1 ring-emerald-500/30",
};

export default async function BehavioralList() {
  const categories = await db.behavioralCategory.findMany({
    include: {
      questions: {
        include: { answers: true },
        orderBy: { text: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-500 mb-2">
          Behavioral
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">STAR question bank</h1>
        <p className="text-zinc-500 mt-1">
          Curated questions by category. Answers stored in Situation / Task / Action / Result form.
        </p>
      </div>

      <div className="space-y-3">
        {categories.map((cat) => {
          const total = cat.questions.length;
          const answered = cat.questions.filter(
            (q) => q.answers.some((a) => a.situation || a.task || a.action || a.result)
          ).length;
          const ratio = total > 0 ? answered / total : 0;
          return (
            <details
              key={cat.id}
              className="rounded-2xl bg-white dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800 ring-1 ring-zinc-900/5 dark:ring-white/5 shadow-sm shadow-zinc-900/5 dark:shadow-black/40 overflow-hidden group"
              open={answered < total}
            >
              <summary className="cursor-pointer px-5 py-3.5 flex items-center justify-between font-medium list-none [&::-webkit-details-marker]:hidden">
                <div className="flex items-center gap-3 min-w-0">
                  <ChevronRight
                    size={14}
                    className="text-zinc-400 transition-transform group-open:rotate-90 shrink-0"
                  />
                  <span className="truncate">{cat.name}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="hidden sm:block w-24 h-1.5 bg-zinc-200/70 dark:bg-zinc-800/70 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
                      style={{ width: `${ratio * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-zinc-500 font-mono">
                    {answered} / {total}
                  </span>
                </div>
              </summary>
              <ul className="border-t border-zinc-100 dark:border-zinc-800/70 divide-y divide-zinc-100 dark:divide-zinc-800/70">
                {cat.questions.map((q) => {
                  const s = status(q.answers);
                  return (
                    <li key={q.id}>
                      <Link
                        href={`/behavioral/${q.id}`}
                        className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-amber-50/40 dark:hover:bg-amber-500/5 transition"
                      >
                        <div className="text-sm">{q.text}</div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wide font-semibold ${STATUS_BADGE[s]}`}
                          >
                            {s}
                          </span>
                          <ChevronRight size={14} className="text-zinc-400" />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </details>
          );
        })}
      </div>
    </div>
  );
}
