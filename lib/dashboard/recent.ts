import { db } from "@/lib/db";

export type RecentItem = {
  module: "leetcode" | "system-design" | "behavioral";
  kind: "submission" | "diagram" | "notes" | "answer";
  title: string;
  subtitle?: string;
  href: string;
  externalHref?: string;
  at: Date;
};

const RECENT_PER_SOURCE = 5;

export async function getRecentActivity(limit = 6): Promise<RecentItem[]> {
  const [submissions, diagrams, notes, answers] = await Promise.all([
    db.leetCodeSubmission.findMany({
      orderBy: { submittedAt: "desc" },
      take: RECENT_PER_SOURCE,
      include: { problem: true },
    }),
    db.diagram.findMany({
      orderBy: { updatedAt: "desc" },
      take: RECENT_PER_SOURCE,
      include: { problem: true },
    }),
    db.systemDesignProblem.findMany({
      where: { notes: { not: null } },
      orderBy: { updatedAt: "desc" },
      take: RECENT_PER_SOURCE,
    }),
    db.behavioralAnswer.findMany({
      orderBy: { updatedAt: "desc" },
      take: RECENT_PER_SOURCE,
      include: { question: { include: { category: true } } },
    }),
  ]);

  const items: RecentItem[] = [];

  for (const s of submissions) {
    items.push({
      module: "leetcode",
      kind: "submission",
      title: s.problem.title,
      subtitle:
        s.status === "ACCEPTED" ? `Accepted · ${s.language}` : `${s.status} · ${s.language}`,
      href: "/leetcode",
      externalHref: s.problem.url,
      at: s.submittedAt,
    });
  }

  for (const d of diagrams) {
    items.push({
      module: "system-design",
      kind: "diagram",
      title: d.problem.title,
      subtitle: `Diagram · ${d.label}`,
      href: `/system-design/${d.problem.slug}`,
      at: d.updatedAt,
    });
  }

  for (const p of notes) {
    if (!p.notes || p.notes.trim().length === 0) continue;
    items.push({
      module: "system-design",
      kind: "notes",
      title: p.title,
      subtitle: "Notes",
      href: `/system-design/${p.slug}`,
      at: p.updatedAt,
    });
  }

  for (const a of answers) {
    const filled = [a.situation, a.task, a.action, a.result].filter(Boolean).length;
    if (filled === 0) continue;
    items.push({
      module: "behavioral",
      kind: "answer",
      title: a.question.text,
      subtitle: `${a.question.category.name} · ${filled}/4 sections`,
      href: `/behavioral/${a.question.id}`,
      at: a.updatedAt,
    });
  }

  return items
    .sort((x, y) => y.at.getTime() - x.at.getTime())
    .slice(0, limit);
}

// Re-export for backward compatibility with existing callers.
export { timeAgo } from "@/lib/utils/time";
