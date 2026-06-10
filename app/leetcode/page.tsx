import Link from "next/link";
import { db } from "@/lib/db";
import { ExternalLink, ArrowDown, ArrowUp, ArrowUpDown, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

type SortKey = "id" | "title" | "difficulty" | "status";
type SortDir = "asc" | "desc";

const VALID_SORTS: SortKey[] = ["id", "title", "difficulty", "status"];
const DEFAULT_DIR: Record<SortKey, SortDir> = {
  id: "asc",
  title: "asc",
  difficulty: "asc",
  status: "desc",
};
const DIFFICULTY_RANK: Record<string, number> = { EASY: 1, MEDIUM: 2, HARD: 3 };

type SearchParams = Promise<{
  difficulty?: string;
  status?: string;
  tag?: string;
  q?: string;
  sort?: string;
  dir?: string;
}>;

const DIFFICULTY_BADGE: Record<string, string> = {
  EASY: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  HARD: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

const FIELD =
  "px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900/60 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50";

function parseTags(s: string): string[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function buildHref(
  base: Record<string, string | undefined>,
  overrides: Record<string, string | undefined>
) {
  const merged = { ...base, ...overrides };
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v) sp.set(k, v);
  }
  const qs = sp.toString();
  return qs ? `/leetcode?${qs}` : "/leetcode";
}

function SortHeader({
  label,
  sortKey,
  activeSort,
  activeDir,
  paramsBase,
}: {
  label: string;
  sortKey: SortKey;
  activeSort: SortKey;
  activeDir: SortDir;
  paramsBase: Record<string, string | undefined>;
}) {
  const isActive = activeSort === sortKey;
  const nextDir: SortDir = isActive
    ? activeDir === "asc"
      ? "desc"
      : "asc"
    : DEFAULT_DIR[sortKey];
  const Icon = isActive ? (activeDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <th className="text-left px-4 py-2.5">
      <Link
        href={buildHref(paramsBase, { sort: sortKey, dir: nextDir })}
        className={`inline-flex items-center gap-1 uppercase tracking-[0.15em] text-[11px] font-semibold transition ${
          isActive
            ? "text-amber-600 dark:text-amber-400"
            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        }`}
      >
        {label}
        <Icon size={11} className={isActive ? "" : "opacity-40"} />
      </Link>
    </th>
  );
}

export default async function LeetCodeList({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const sortKey: SortKey = (VALID_SORTS as string[]).includes(params.sort ?? "")
    ? (params.sort as SortKey)
    : "id";
  const sortDir: SortDir = params.dir === "desc" ? "desc" : "asc";

  const where: Record<string, unknown> = {};
  if (params.difficulty) where.difficulty = params.difficulty.toUpperCase();
  if (params.q) where.title = { contains: params.q };
  if (params.tag) where.tags = { contains: `"${params.tag}"` };

  const problems = await db.leetCodeProblem.findMany({
    where,
    include: {
      submissions: {
        where: { status: "ACCEPTED" },
        orderBy: { submittedAt: "desc" },
        take: 1,
      },
    },
    orderBy: [{ id: "asc" }],
    take: 500,
  });

  const filtered = problems.filter((p) => {
    if (!params.status) return true;
    const solved = p.submissions.length > 0;
    if (params.status === "solved") return solved;
    if (params.status === "untouched") return !solved;
    return true;
  });

  const dirMul = sortDir === "asc" ? 1 : -1;
  filtered.sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case "id":
        cmp = a.id - b.id;
        break;
      case "title":
        cmp = a.title.localeCompare(b.title);
        break;
      case "difficulty":
        cmp =
          (DIFFICULTY_RANK[a.difficulty] ?? 99) - (DIFFICULTY_RANK[b.difficulty] ?? 99);
        if (cmp === 0) cmp = a.id - b.id;
        break;
      case "status": {
        const aSolved = a.submissions.length > 0 ? 1 : 0;
        const bSolved = b.submissions.length > 0 ? 1 : 0;
        cmp = aSolved - bSolved;
        if (cmp === 0) cmp = a.id - b.id;
        break;
      }
    }
    return cmp * dirMul;
  });

  // gather all tag slugs across the visible set for the tag dropdown
  const tagSet = new Set<string>();
  for (const p of problems) for (const t of parseTags(p.tags)) tagSet.add(t);
  const tagList = Array.from(tagSet).sort();

  // Used by header links to preserve filters and by the form to preserve sort.
  const paramsBase = {
    q: params.q,
    difficulty: params.difficulty,
    status: params.status,
    tag: params.tag,
    sort: sortKey,
    dir: sortDir,
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-500 mb-2">
            LeetCode
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Problems</h1>
          <p className="text-zinc-500 mt-1">
            {filtered.length} of {problems.length} shown
            {problems.length === 0 && (
              <>
                {" — "}
                <Link
                  href="/leetcode/settings"
                  className="text-amber-600 dark:text-amber-400 hover:underline"
                >
                  set up sync
                </Link>
              </>
            )}
          </p>
        </div>
        <Link
          href="/leetcode/stats"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold bg-amber-500/10 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-400 dark:hover:text-zinc-950 transition shrink-0"
        >
          View stats <ArrowRight size={14} />
        </Link>
      </div>

      <form className="flex flex-wrap gap-2 mb-4" method="get">
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Search title…"
          className={FIELD}
        />
        <select name="difficulty" defaultValue={params.difficulty ?? ""} className={FIELD}>
          <option value="">All difficulties</option>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>
        <select name="status" defaultValue={params.status ?? ""} className={FIELD}>
          <option value="">All statuses</option>
          <option value="solved">Solved</option>
          <option value="untouched">Untouched</option>
        </select>
        <select name="tag" defaultValue={params.tag ?? ""} className={FIELD}>
          <option value="">All tags</option>
          {tagList.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {/* Preserve current sort across filter submissions */}
        <input type="hidden" name="sort" value={sortKey} />
        <input type="hidden" name="dir" value={sortDir} />
        <button
          type="submit"
          className="px-3.5 py-1.5 rounded-lg bg-gradient-to-b from-amber-400 to-amber-500 text-zinc-950 text-sm font-semibold shadow-sm shadow-amber-500/40 hover:from-amber-300 hover:to-amber-400 transition"
        >
          Filter
        </button>
        <Link
          href="/leetcode"
          className="px-3.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
        >
          Reset
        </Link>
      </form>

      {filtered.length === 0 ? (
        <div className="rounded-2xl p-10 text-center text-sm text-zinc-500 border border-dashed border-zinc-300 dark:border-zinc-700 bg-white/40 dark:bg-zinc-900/40">
          {problems.length === 0 ? (
            <>
              No problems synced yet.{" "}
              <Link
                href="/leetcode/settings"
                className="text-amber-600 dark:text-amber-400 font-semibold hover:underline"
              >
                Add your LeetCode session cookie
              </Link>{" "}
              to begin.
            </>
          ) : (
            "No problems match the current filters."
          )}
        </div>
      ) : (
        <div className="rounded-2xl overflow-x-auto bg-white dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800 ring-1 ring-zinc-900/5 dark:ring-white/5 shadow-sm shadow-zinc-900/5 dark:shadow-black/40">
          <table className="w-full text-sm min-w-[560px]">
            <thead className="bg-zinc-50/80 dark:bg-zinc-900/40 border-b border-zinc-200/80 dark:border-zinc-800">
              <tr>
                <SortHeader
                  label="#"
                  sortKey="id"
                  activeSort={sortKey}
                  activeDir={sortDir}
                  paramsBase={paramsBase}
                />
                <SortHeader
                  label="Title"
                  sortKey="title"
                  activeSort={sortKey}
                  activeDir={sortDir}
                  paramsBase={paramsBase}
                />
                <SortHeader
                  label="Difficulty"
                  sortKey="difficulty"
                  activeSort={sortKey}
                  activeDir={sortDir}
                  paramsBase={paramsBase}
                />
                <th className="hidden md:table-cell text-left px-4 py-2.5 text-[11px] uppercase tracking-[0.15em] font-semibold text-zinc-500">
                  Tags
                </th>
                <SortHeader
                  label="Status"
                  sortKey="status"
                  activeSort={sortKey}
                  activeDir={sortDir}
                  paramsBase={paramsBase}
                />
                <th className="text-left px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 200).map((p) => {
                const tags = parseTags(p.tags);
                const solved = p.submissions.length > 0;
                return (
                  <tr
                    key={p.id}
                    className="border-t border-zinc-100 dark:border-zinc-800/70 hover:bg-amber-50/40 dark:hover:bg-amber-500/5 transition"
                  >
                    <td className="px-4 py-2.5 text-zinc-500 font-mono text-xs">{p.id}</td>
                    <td className="px-4 py-2.5 font-medium">
                      {p.title}
                      {p.isPaid && (
                        <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">premium</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          DIFFICULTY_BADGE[p.difficulty] ?? ""
                        }`}
                      >
                        {p.difficulty}
                      </span>
                    </td>
                    <td className="hidden md:table-cell px-4 py-2.5 text-xs text-zinc-500 whitespace-nowrap">
                      <span className="hidden xl:inline">
                        {tags.slice(0, 3).join(", ")}
                        {tags.length > 3 && ` +${tags.length - 3}`}
                      </span>
                      <span className="hidden lg:inline xl:hidden">
                        {tags.slice(0, 2).join(", ")}
                        {tags.length > 2 && ` +${tags.length - 2}`}
                      </span>
                      <span className="hidden md:inline lg:hidden">
                        {tags.slice(0, 1).join(", ")}
                        {tags.length > 1 && ` +${tags.length - 1}`}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {solved ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                          ✓ Solved
                        </span>
                      ) : (
                        <span className="text-zinc-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400 transition"
                      >
                        Open <ExternalLink size={12} />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length > 200 && (
            <div className="text-xs text-zinc-500 text-center py-2 border-t border-zinc-100 dark:border-zinc-800/70">
              Showing first 200 of {filtered.length}. Filter to narrow.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
