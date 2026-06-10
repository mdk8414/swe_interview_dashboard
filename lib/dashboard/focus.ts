import { db } from "@/lib/db";
import { suggestProblems } from "@/lib/leetcode/analysis";

export type FocusItem = {
  module: "leetcode" | "system-design" | "behavioral";
  title: string;
  subtitle?: string;
  href: string;
  cta: string;
};

export type FocusResult =
  | { kind: "ready"; item: FocusItem }
  | { kind: "empty"; message: string; href?: string; cta?: string };

export async function pickLeetCodeFocus(): Promise<FocusResult> {
  const credential = await db.leetCodeCredential.findUnique({ where: { id: 1 } });
  if (!credential?.sessionCookie) {
    return {
      kind: "empty",
      message: "No LeetCode credentials yet.",
      href: "/leetcode/settings",
      cta: "Set up sync",
    };
  }
  const [pick] = await suggestProblems(1);
  if (!pick) {
    return {
      kind: "empty",
      message: "No suggestion available — sync first or you've covered the weak tags.",
      href: "/leetcode",
      cta: "Browse problems",
    };
  }
  return {
    kind: "ready",
    item: {
      module: "leetcode",
      title: pick.title,
      subtitle: pick.difficulty,
      href: pick.url,
      cta: "Open on LeetCode",
    },
  };
}

export async function pickBehavioralFocus(): Promise<FocusResult> {
  const allQuestions = await db.behavioralQuestion.findMany({
    include: { category: true, answers: true },
  });
  if (allQuestions.length === 0) {
    return { kind: "empty", message: "No behavioral questions seeded." };
  }
  const isAnswered = (q: (typeof allQuestions)[number]) =>
    q.answers.some((a) => a.situation || a.task || a.action || a.result);

  const byCategory = new Map<string, { answered: number; total: number }>();
  for (const q of allQuestions) {
    const name = q.category.name;
    const cur = byCategory.get(name) ?? { answered: 0, total: 0 };
    cur.total += 1;
    if (isAnswered(q)) cur.answered += 1;
    byCategory.set(name, cur);
  }

  const weakest = Array.from(byCategory.entries()).sort(
    ([, a], [, b]) => a.answered / a.total - b.answered / b.total
  )[0];
  if (!weakest) return { kind: "empty", message: "No categories." };
  const [weakestName] = weakest;

  const candidate =
    allQuestions.find((q) => q.category.name === weakestName && !isAnswered(q)) ??
    allQuestions.find((q) => !isAnswered(q));

  if (!candidate) {
    return {
      kind: "empty",
      message: "Every behavioral question has at least one drafted answer 🎉",
      href: "/behavioral",
      cta: "Polish answers",
    };
  }
  return {
    kind: "ready",
    item: {
      module: "behavioral",
      title: candidate.text,
      subtitle: candidate.category.name,
      href: `/behavioral/${candidate.id}`,
      cta: "Answer",
    },
  };
}

export async function pickSystemDesignFocus(): Promise<FocusResult> {
  const problems = await db.systemDesignProblem.findMany({
    include: { diagrams: { select: { updatedAt: true } } },
  });
  if (problems.length === 0) {
    return { kind: "empty", message: "No system design problems seeded." };
  }
  const lastTouched = (p: (typeof problems)[number]) => {
    const dates = [
      p.updatedAt.getTime(),
      ...p.diagrams.map((d) => d.updatedAt.getTime()),
    ];
    return Math.max(...dates);
  };
  const oldest = problems
    .map((p) => ({ p, t: lastTouched(p) }))
    .sort((a, b) => a.t - b.t)[0].p;

  const diagramCount = oldest.diagrams.length;
  return {
    kind: "ready",
    item: {
      module: "system-design",
      title: oldest.title,
      subtitle:
        diagramCount === 0
          ? "No diagrams yet"
          : `${diagramCount} diagram${diagramCount === 1 ? "" : "s"}`,
      href: `/system-design/${oldest.slug}`,
      cta: "Open",
    },
  };
}

export async function getTodaysFocus() {
  const [leetcode, behavioral, systemDesign] = await Promise.all([
    pickLeetCodeFocus(),
    pickBehavioralFocus(),
    pickSystemDesignFocus(),
  ]);
  return {
    leetcode,
    behavioral,
    "system-design": systemDesign,
  };
}
