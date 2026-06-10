import { Code2, GitBranch, MessageSquare } from "lucide-react";
import {
  type ActivityData,
  type DailyCounts,
  type ModuleKey,
  HEATMAP_DAYS,
  dayKeysFromCutoff,
} from "@/lib/dashboard/activity";

const META: Record<ModuleKey, { label: string; Icon: typeof Code2 }> = {
  leetcode: { label: "LeetCode", Icon: Code2 },
  "system-design": { label: "System Design", Icon: GitBranch },
  behavioral: { label: "Behavioral", Icon: MessageSquare },
};

function intensityClass(count: number): string {
  if (count <= 0) return "bg-zinc-200/70 dark:bg-zinc-800/70";
  if (count === 1) return "bg-amber-200 dark:bg-amber-900/70";
  if (count <= 4) return "bg-amber-400 dark:bg-amber-600";
  return "bg-amber-500 dark:bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.55)]";
}

function HeatmapRow({
  moduleKey,
  counts,
  dayKeys,
}: {
  moduleKey: ModuleKey;
  counts: DailyCounts;
  dayKeys: string[];
}) {
  const { label, Icon } = META[moduleKey];
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 w-32 shrink-0 text-xs text-zinc-500">
        <Icon size={12} />
        {label}
      </div>
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: "repeat(12, 16px)",
          gridTemplateRows: "repeat(7, 16px)",
          gridAutoFlow: "column",
        }}
      >
        {dayKeys.map((key) => {
          const count = counts[key] ?? 0;
          return (
            <div
              key={key}
              title={`${key} · ${count} ${label} action${count === 1 ? "" : "s"}`}
              className={`rounded-sm ${intensityClass(count)}`}
            />
          );
        })}
      </div>
    </div>
  );
}

export function ActivityHeatmap({ data }: { data: ActivityData }) {
  const dayKeys = dayKeysFromCutoff(HEATMAP_DAYS);
  return (
    <section className="mt-10 max-w-2xl">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Activity</h2>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span>Less</span>
          <div className="flex gap-[3px]">
            {[0, 1, 2, 5].map((c) => (
              <div
                key={c}
                className={`w-[10px] h-[10px] rounded-sm ${intensityClass(c)}`}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>
      <div className="rounded-2xl p-4 space-y-3 bg-white dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800 ring-1 ring-zinc-900/5 dark:ring-white/5 shadow-sm shadow-zinc-900/5 dark:shadow-black/40">
        <HeatmapRow moduleKey="leetcode" counts={data.leetcode} dayKeys={dayKeys} />
        <HeatmapRow
          moduleKey="system-design"
          counts={data["system-design"]}
          dayKeys={dayKeys}
        />
        <HeatmapRow
          moduleKey="behavioral"
          counts={data.behavioral}
          dayKeys={dayKeys}
        />
      </div>
    </section>
  );
}
