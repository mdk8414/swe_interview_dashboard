import { db } from "@/lib/db";

export type TagStat = {
  tag: string;
  total: number;
  solved: number;
  easyTotal: number;
  mediumTotal: number;
  hardTotal: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  weakness: number;
};

const SOLVED_WEIGHT = { EASY: 0.5, MEDIUM: 1, HARD: 1.5 } as const;

function parseTags(s: string): string[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function emptyTagBucket() {
  return {
    total: 0,
    solved: 0,
    easyTotal: 0,
    mediumTotal: 0,
    hardTotal: 0,
    easySolved: 0,
    mediumSolved: 0,
    hardSolved: 0,
  };
}

export async function tagStats(): Promise<TagStat[]> {
  const problems = await db.leetCodeProblem.findMany({
    include: { submissions: { where: { status: "ACCEPTED" }, take: 1 } },
  });
  const map = new Map<string, ReturnType<typeof emptyTagBucket>>();
  for (const p of problems) {
    const tags = parseTags(p.tags);
    const accepted = p.submissions.length > 0;
    const diff = (p.difficulty?.toUpperCase() || "EASY") as "EASY" | "MEDIUM" | "HARD";
    for (const tag of tags) {
      const cur = map.get(tag) ?? emptyTagBucket();
      cur.total += 1;
      if (diff === "EASY") cur.easyTotal += 1;
      else if (diff === "MEDIUM") cur.mediumTotal += 1;
      else if (diff === "HARD") cur.hardTotal += 1;
      if (accepted) {
        cur.solved += 1;
        if (diff === "EASY") cur.easySolved += 1;
        else if (diff === "MEDIUM") cur.mediumSolved += 1;
        else if (diff === "HARD") cur.hardSolved += 1;
      }
      map.set(tag, cur);
    }
  }
  // weakness = 1 / (1 + strength), where strength is difficulty-weighted solves.
  // Tag size is intentionally ignored — N solves should score the same regardless of tag size.
  return Array.from(map.entries())
    .map(([tag, v]) => {
      const strength =
        SOLVED_WEIGHT.EASY * v.easySolved +
        SOLVED_WEIGHT.MEDIUM * v.mediumSolved +
        SOLVED_WEIGHT.HARD * v.hardSolved;

      const weakness = 1 / (1 + strength);
      return { tag, ...v, weakness };
    })
    .sort((a, b) => b.weakness - a.weakness);
}

export async function difficultyBreakdown() {
  const problems = await db.leetCodeProblem.findMany({
    include: { submissions: { where: { status: "ACCEPTED" }, take: 1 } },
  });
  const out: Record<string, { total: number; solved: number }> = {
    EASY: { total: 0, solved: 0 },
    MEDIUM: { total: 0, solved: 0 },
    HARD: { total: 0, solved: 0 },
  };
  for (const p of problems) {
    const k = p.difficulty?.toUpperCase() || "EASY";
    if (!out[k]) out[k] = { total: 0, solved: 0 };
    out[k].total += 1;
    if (p.submissions.length > 0) out[k].solved += 1;
  }
  return out;
}

export async function suggestProblems(limit = 5) {
  const stats = await tagStats();
  // weakest tags sit at the top of the list now (ascending sort)
  const weakTags = new Set(stats.slice(0, 5).map((s) => s.tag));
  const candidates = await db.leetCodeProblem.findMany({
    where: { isPaid: false, submissions: { none: { status: "ACCEPTED" } } },
    take: 200,
  });
  const scored = candidates
    .map((p) => {
      const tags = parseTags(p.tags);
      const tagScore = tags.reduce((acc, t) => acc + (weakTags.has(t) ? 1 : 0), 0);
      const acRate = p.acRate ?? 0.5;
      const acScore = acRate > 0.3 && acRate < 0.7 ? 1 : 0;
      return { p, score: tagScore * 2 + acScore };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return scored.map((s) => s.p);
}
