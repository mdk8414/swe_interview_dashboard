"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import type { TagStat } from "@/lib/leetcode/analysis";

const PAGE_SIZE = 25;

type SortKey = "tag" | "solved" | "easySolved" | "mediumSolved" | "hardSolved" | "weakness";
type SortDir = "asc" | "desc";

const DEFAULT_DIR: Record<SortKey, SortDir> = {
  tag: "asc",
  solved: "desc",
  easySolved: "desc",
  mediumSolved: "desc",
  hardSolved: "desc",
  weakness: "desc",
};

function compareBy(key: SortKey, dir: SortDir) {
  return (a: TagStat, b: TagStat) => {
    let cmp: number;
    if (key === "tag") cmp = a.tag.localeCompare(b.tag);
    else cmp = (a[key] as number) - (b[key] as number);
    return dir === "asc" ? cmp : -cmp;
  };
}

function SortableHeader({
  label,
  sortKey,
  active,
  dir,
  onClick,
}: {
  label: string;
  sortKey: SortKey;
  active: SortKey;
  dir: SortDir;
  onClick: (k: SortKey) => void;
}) {
  const isActive = active === sortKey;
  const Icon = isActive ? (dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <th className="text-left px-4 py-2.5">
      <button
        type="button"
        onClick={() => onClick(sortKey)}
        className={`inline-flex items-center gap-1 uppercase tracking-[0.15em] text-[11px] font-semibold transition ${
          isActive
            ? "text-amber-600 dark:text-amber-400"
            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        }`}
      >
        {label}
        <Icon size={11} className={isActive ? "" : "opacity-40"} />
      </button>
    </th>
  );
}

export function GapAnalysisTable({ stats }: { stats: TagStat[] }) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("weakness");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);

  const handleSort = (k: SortKey) => {
    if (k === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(k);
      setSortDir(DEFAULT_DIR[k]);
    }
    setPage(0);
  };

  const sorted = useMemo(
    () => [...stats].sort(compareBy(sortKey, sortDir)),
    [stats, sortKey, sortDir]
  );
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const start = safePage * PAGE_SIZE;
  const rows = sorted.slice(start, start + PAGE_SIZE);

  return (
    <div>
      <div className="flex justify-end mb-2">
        <label className="inline-flex items-center gap-2 text-xs text-zinc-500 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showBreakdown}
            onChange={(e) => setShowBreakdown(e.target.checked)}
            className="accent-amber-500"
          />
          Show E/M/H breakdown
        </label>
      </div>

      <div className="rounded-2xl bg-white dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800 ring-1 ring-zinc-900/5 dark:ring-white/5 shadow-sm shadow-zinc-900/5 dark:shadow-black/40 overflow-visible">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50/80 dark:bg-zinc-900/40 border-b border-zinc-200/80 dark:border-zinc-800">
            <tr>
              <SortableHeader
                label="Tag"
                sortKey="tag"
                active={sortKey}
                dir={sortDir}
                onClick={handleSort}
              />
              <SortableHeader
                label="Solved / Total"
                sortKey="solved"
                active={sortKey}
                dir={sortDir}
                onClick={handleSort}
              />
              {showBreakdown && (
                <>
                  <SortableHeader
                    label="Easy"
                    sortKey="easySolved"
                    active={sortKey}
                    dir={sortDir}
                    onClick={handleSort}
                  />
                  <SortableHeader
                    label="Medium"
                    sortKey="mediumSolved"
                    active={sortKey}
                    dir={sortDir}
                    onClick={handleSort}
                  />
                  <SortableHeader
                    label="Hard"
                    sortKey="hardSolved"
                    active={sortKey}
                    dir={sortDir}
                    onClick={handleSort}
                  />
                </>
              )}
              <SortableHeader
                label="Weakness"
                sortKey="weakness"
                active={sortKey}
                dir={sortDir}
                onClick={handleSort}
              />
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr
                key={s.tag}
                className="border-t border-zinc-100 dark:border-zinc-800/70 hover:bg-amber-50/40 dark:hover:bg-amber-500/5 transition"
              >
                <td className="px-4 py-2.5">
                  <Link
                    href={`/leetcode?tag=${encodeURIComponent(s.tag)}&status=untouched`}
                    className="font-medium hover:text-amber-600 dark:hover:text-amber-400 transition"
                  >
                    {s.tag}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-zinc-500 relative">
                  {showBreakdown ? (
                    <span>
                      {s.solved} / {s.total}
                    </span>
                  ) : (
                    <span className="group relative inline-block cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">
                      {s.solved} / {s.total}
                      <span
                        role="tooltip"
                        className="pointer-events-none absolute left-0 top-full mt-1 z-20 hidden group-hover:block whitespace-nowrap rounded-lg border border-amber-500/30 bg-zinc-900 text-zinc-100 text-xs px-3 py-2 shadow-lg shadow-black/40"
                      >
                        <span className="block text-emerald-400">
                          Easy: {s.easySolved} / {s.easyTotal}
                        </span>
                        <span className="block text-amber-400">
                          Medium: {s.mediumSolved} / {s.mediumTotal}
                        </span>
                        <span className="block text-rose-400">
                          Hard: {s.hardSolved} / {s.hardTotal}
                        </span>
                      </span>
                    </span>
                  )}
                </td>
                {showBreakdown && (
                  <>
                    <td className="px-4 py-2.5 text-zinc-500">
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">{s.easySolved}</span>
                      <span className="text-zinc-400"> / {s.easyTotal}</span>
                    </td>
                    <td className="px-4 py-2.5 text-zinc-500">
                      <span className="text-amber-600 dark:text-amber-400 font-medium">{s.mediumSolved}</span>
                      <span className="text-zinc-400"> / {s.mediumTotal}</span>
                    </td>
                    <td className="px-4 py-2.5 text-zinc-500">
                      <span className="text-rose-600 dark:text-rose-400 font-medium">{s.hardSolved}</span>
                      <span className="text-zinc-400"> / {s.hardTotal}</span>
                    </td>
                  </>
                )}
                <td className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300 font-mono">
                  {s.weakness.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sorted.length > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-3 text-xs text-zinc-500">
          <span>
            Showing {start + 1}–{Math.min(start + PAGE_SIZE, sorted.length)} of {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:border-amber-300 dark:hover:border-amber-500/40 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-zinc-300 dark:disabled:hover:border-zinc-700 transition"
            >
              <ChevronLeft size={12} /> Prev
            </button>
            <span className="px-2">
              Page {safePage + 1} of {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={safePage >= pageCount - 1}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:border-amber-300 dark:hover:border-amber-500/40 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-zinc-300 dark:disabled:hover:border-zinc-700 transition"
            >
              Next <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
