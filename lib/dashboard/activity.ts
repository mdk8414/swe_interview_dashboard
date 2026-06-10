import { db } from "@/lib/db";

export type ModuleKey = "leetcode" | "system-design" | "behavioral";
export type DailyCounts = Record<string, number>; // 'YYYY-MM-DD' -> count

export type ActivityData = {
  leetcode: DailyCounts;
  "system-design": DailyCounts;
  behavioral: DailyCounts;
};

export const HEATMAP_DAYS = 84;

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function bumpCount(counts: DailyCounts, when: Date) {
  const key = isoDate(when);
  counts[key] = (counts[key] ?? 0) + 1;
}

export async function getActivityByDay(days = HEATMAP_DAYS): Promise<ActivityData> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const data: ActivityData = {
    leetcode: {},
    "system-design": {},
    behavioral: {},
  };

  const [submissions, diagrams, problems, answers] = await Promise.all([
    db.leetCodeSubmission.findMany({
      where: { submittedAt: { gte: cutoff } },
      select: { submittedAt: true },
    }),
    db.diagram.findMany({
      where: { updatedAt: { gte: cutoff } },
      select: { updatedAt: true },
    }),
    db.systemDesignProblem.findMany({
      where: { updatedAt: { gte: cutoff }, notes: { not: null } },
      select: { updatedAt: true, notes: true },
    }),
    db.behavioralAnswer.findMany({
      where: { updatedAt: { gte: cutoff } },
      select: { updatedAt: true, situation: true, task: true, action: true, result: true },
    }),
  ]);

  for (const s of submissions) bumpCount(data.leetcode, s.submittedAt);
  for (const d of diagrams) bumpCount(data["system-design"], d.updatedAt);
  for (const p of problems) {
    if (p.notes && p.notes.trim().length > 0) {
      bumpCount(data["system-design"], p.updatedAt);
    }
  }
  for (const a of answers) {
    if (a.situation || a.task || a.action || a.result) {
      bumpCount(data.behavioral, a.updatedAt);
    }
  }

  return data;
}

export function dayKeysFromCutoff(days = HEATMAP_DAYS): string[] {
  const out: string[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push(isoDate(d));
  }
  return out;
}

// Bin daily counts into N weekly buckets (7 days each), oldest first.
// Falls back to zeros if a key is missing.
export function weeklyFromDaily(counts: DailyCounts, weeks = 12): number[] {
  const dayKeys = dayKeysFromCutoff(weeks * 7);
  const out: number[] = [];
  for (let w = 0; w < weeks; w++) {
    let sum = 0;
    for (let d = 0; d < 7; d++) {
      sum += counts[dayKeys[w * 7 + d]] ?? 0;
    }
    out.push(sum);
  }
  return out;
}
