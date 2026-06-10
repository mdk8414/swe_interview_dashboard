import { db } from "@/lib/db";
import { getAuthedClient } from "./client";

const PAGE_SIZE = 100;
const MAX_PAGES = 30;
const SUBMISSION_FETCH_LIMIT = 50;

export type SyncResult = {
  problemsUpserted: number;
  submissionsUpserted: number;
  username?: string;
  durationMs: number;
};

export async function runSync(): Promise<SyncResult> {
  const start = Date.now();
  const client = await getAuthedClient();
  if (!client) {
    throw new Error(
      "No LeetCode credentials configured. Visit /leetcode/settings."
    );
  }

  const me = await client.whoami().catch(() => null);
  const username = me?.username;

  let problemsUpserted = 0;

  for (let page = 0; page < MAX_PAGES; page++) {
    const list = await client.problems({
      category: "all-code-essentials",
      offset: page * PAGE_SIZE,
      limit: PAGE_SIZE,
    });
    if (!list.questions.length) break;

    for (const q of list.questions) {
      const id = parseInt(q.questionFrontendId, 10);
      if (!Number.isFinite(id)) continue;
      const tagSlugs = q.topicTags.map((t) => t.slug);
      const data = {
        slug: q.titleSlug,
        title: q.title,
        difficulty: q.difficulty.toUpperCase(),
        tags: JSON.stringify(tagSlugs),
        url: `https://leetcode.com/problems/${q.titleSlug}/`,
        isPaid: q.isPaidOnly,
        acRate: q.acRate,
      };
      await db.leetCodeProblem.upsert({
        where: { id },
        update: data,
        create: { id, ...data },
      });
      problemsUpserted++;

      if (q.status === "ac") {
        const existing = await db.leetCodeSubmission.findFirst({
          where: { problemId: id, status: "ACCEPTED" },
        });
        if (!existing) {
          await db.leetCodeSubmission.create({
            data: {
              problemId: id,
              status: "ACCEPTED",
              language: "unknown",
              submittedAt: new Date(),
            },
          });
        }
      }
    }

    if (list.questions.length < PAGE_SIZE) break;
  }

  let submissionsUpserted = 0;
  try {
    const subs = await client.submissions({ limit: SUBMISSION_FETCH_LIMIT, offset: 0 });
    for (const s of subs) {
      if (!s.titleSlug) continue;
      const problem = await db.leetCodeProblem.findUnique({
        where: { slug: s.titleSlug },
      });
      if (!problem) continue;
      const submittedAt = s.timestamp
        ? new Date(Number(s.timestamp) * 1000)
        : new Date();
      const id = `${problem.id}-${s.timestamp ?? Date.now()}-${s.lang ?? "x"}`;
      await db.leetCodeSubmission.upsert({
        where: { id },
        update: {},
        create: {
          id,
          problemId: problem.id,
          status: s.statusDisplay === "Accepted" ? "ACCEPTED" : s.statusDisplay ?? "UNKNOWN",
          language: s.lang ?? "unknown",
          submittedAt,
        },
      });
      submissionsUpserted++;
    }
  } catch (e) {
    // Submissions endpoint sometimes 401s on cookie issues; carry on with catalog data.
    console.warn("Submission fetch failed:", e);
  }

  await db.leetCodeCredential.update({
    where: { id: 1 },
    data: { lastSyncAt: new Date(), username },
  });

  return {
    problemsUpserted,
    submissionsUpserted,
    username,
    durationMs: Date.now() - start,
  };
}
