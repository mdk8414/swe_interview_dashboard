import { db } from "@/lib/db";
import { Card } from "@/components/Card";
import { tagStats } from "@/lib/leetcode/analysis";
import { getRecentActivity } from "@/lib/dashboard/recent";
import { RecentActivity } from "@/components/RecentActivity";
import { getTodaysFocus } from "@/lib/dashboard/focus";
import { TodaysFocus } from "@/components/TodaysFocus";
import { getActivityByDay, weeklyFromDaily } from "@/lib/dashboard/activity";
import { ActivityHeatmap } from "@/components/ActivityHeatmap";
import { Sparkline } from "@/components/Sparkline";

export const dynamic = "force-dynamic";

async function leetcodeSummary() {
  const [solved, lastWeek, stats] = await Promise.all([
    db.leetCodeSubmission.findMany({
      where: { status: "ACCEPTED" },
      distinct: ["problemId"],
      select: { problemId: true },
    }),
    db.leetCodeSubmission.count({
      where: {
        status: "ACCEPTED",
        submittedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    tagStats(),
  ]);
  const weakSpots = stats.slice(0, 3).map((s) => ({
    name: s.tag,
    solved: s.solved,
    total: s.total,
  }));
  return { solved: solved.length, lastWeek, weakSpots };
}

async function systemDesignSummary() {
  const [problems, diagrams] = await Promise.all([
    db.systemDesignProblem.count(),
    db.diagram.count(),
  ]);
  return { problems, diagrams };
}

async function behavioralSummary() {
  const allQuestions = await db.behavioralQuestion.findMany({
    include: { category: true, answers: true },
  });
  const questions = allQuestions.length;
  const answered = allQuestions.filter((q) =>
    q.answers.some((a) => a.situation || a.task || a.action || a.result)
  ).length;

  const byCategory = new Map<string, { total: number; answered: number }>();
  for (const q of allQuestions) {
    const name = q.category.name;
    const cur = byCategory.get(name) ?? { total: 0, answered: 0 };
    cur.total += 1;
    if (q.answers.some((a) => a.situation || a.task || a.action || a.result)) {
      cur.answered += 1;
    }
    byCategory.set(name, cur);
  }
  const weakSpots = Array.from(byCategory.entries())
    .map(([name, v]) => ({ name, answered: v.answered, total: v.total }))
    .sort((a, b) => a.answered / a.total - b.answered / b.total)
    .slice(0, 3);
  return { questions, answered, weakSpots };
}

function WeakSpotsList({
  items,
}: {
  items: { name: string; solved?: number; total: number; answered?: number }[];
}) {
  return (
    <ul className="mt-3 space-y-1.5">
      {items.map((item) => {
        const completed = item.solved ?? item.answered ?? 0;
        const ratio = item.total > 0 ? completed / item.total : 0;
        return (
          <li key={item.name} className="text-xs">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-zinc-700 dark:text-zinc-300 truncate">
                {item.name}
              </span>
              <span className="text-zinc-500 shrink-0">
                {completed} / {item.total}
              </span>
            </div>
            <div className="h-1.5 mt-1 bg-zinc-200/70 dark:bg-zinc-800/70 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 dark:from-amber-500 dark:to-amber-400"
                style={{ width: `${ratio * 100}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default async function Dashboard() {
  const [lc, sd, beh, recent, focus, activity] = await Promise.all([
    leetcodeSummary(),
    systemDesignSummary(),
    behavioralSummary(),
    getRecentActivity(6),
    getTodaysFocus(),
    getActivityByDay(),
  ]);

  const trends = {
    leetcode: weeklyFromDaily(activity.leetcode, 12),
    "system-design": weeklyFromDaily(activity["system-design"], 12),
    behavioral: weeklyFromDaily(activity.behavioral, 12),
  };

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 5) return "Burning the midnight oil";
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    if (h < 22) return "Good evening";
    return "Up late";
  })();

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-500 mb-2">
          Sweatshirt
        </div>
        <h1 className="text-4xl font-semibold tracking-tight">
          {greeting}.
        </h1>
        <p className="text-zinc-500 mt-1">
          Here&rsquo;s where you are across LeetCode, system design, and behavioral prep.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card href="/leetcode" title="LeetCode" accent>
          <div className="text-4xl font-bold tracking-tight text-amber-500 dark:text-amber-400">
            {lc.solved}
            <span className="text-base font-normal text-zinc-500 ml-1.5">solved</span>
          </div>
          <div className="text-sm text-zinc-500 mt-2">
            {lc.lastWeek} accepted in last 7 days
          </div>
          {lc.weakSpots.length > 0 && (
            <>
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mt-4">
                Weakest tags
              </div>
              <WeakSpotsList items={lc.weakSpots} />
            </>
          )}
          {lc.solved === 0 && (
            <div className="text-sm text-amber-600 mt-3">
              Add LeetCode credentials in Settings to begin syncing.
            </div>
          )}
          <Sparkline data={trends.leetcode} ariaLabel="LeetCode submissions, last 12 weeks" />
        </Card>

        <Card href="/system-design" title="System Design" accent>
          <div className="text-4xl font-bold tracking-tight text-amber-500 dark:text-amber-400">
            {sd.problems}
            <span className="text-base font-normal text-zinc-500 ml-1.5">problems</span>
          </div>
          <div className="text-sm text-zinc-500 mt-2">
            {sd.diagrams} diagram{sd.diagrams === 1 ? "" : "s"} saved
          </div>
          <Sparkline data={trends["system-design"]} ariaLabel="System design edits, last 12 weeks" />
        </Card>

        <Card href="/behavioral" title="Behavioral" accent>
          <div className="text-4xl font-bold tracking-tight text-amber-500 dark:text-amber-400">
            {beh.answered}
            <span className="text-base font-normal text-zinc-500 ml-1.5">
              / {beh.questions} answered
            </span>
          </div>
          {beh.weakSpots.length > 0 && (
            <>
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mt-4">
                Weakest categories
              </div>
              <WeakSpotsList items={beh.weakSpots} />
            </>
          )}
          <Sparkline data={trends.behavioral} ariaLabel="Behavioral edits, last 12 weeks" />
        </Card>
      </div>

      <div className="mt-8">
        <TodaysFocus focus={focus} />
      </div>

      <ActivityHeatmap data={activity} />

      <RecentActivity items={recent} />
    </div>
  );
}
