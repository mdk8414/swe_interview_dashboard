import Link from "next/link";
import { Code2, GitBranch, MessageSquare, FileText, ExternalLink } from "lucide-react";
import type { RecentItem } from "@/lib/dashboard/recent";
import { timeAgo } from "@/lib/utils/time";

const ICONS = {
  leetcode: Code2,
  "system-design": GitBranch,
  behavioral: MessageSquare,
} as const;

const KIND_LABEL = {
  submission: "LeetCode",
  diagram: "Diagram",
  notes: "Notes",
  answer: "Behavioral",
} as const;

function ActivityRow({ item }: { item: RecentItem }) {
  const Icon = item.kind === "notes" ? FileText : ICONS[item.module];
  return (
    <li className="flex items-center gap-3 hover:bg-amber-50/40 dark:hover:bg-amber-500/5 transition">
      <Link
        href={item.href}
        className="flex items-center gap-3 px-4 py-3 flex-1 min-w-0"
      >
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-100/70 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 shrink-0">
          <Icon size={14} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 shrink-0">
              {KIND_LABEL[item.kind]}
            </span>
            <span className="font-medium text-sm truncate">{item.title}</span>
          </div>
          {item.subtitle && (
            <div className="text-xs text-zinc-500 truncate">{item.subtitle}</div>
          )}
        </div>
        <span className="text-xs text-zinc-400 shrink-0">{timeAgo(item.at)}</span>
      </Link>
      {item.externalHref && (
        <a
          href={item.externalHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open on LeetCode"
          className="px-3 py-3 text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 transition"
        >
          <ExternalLink size={12} />
        </a>
      )}
    </li>
  );
}

export function RecentActivity({ items }: { items: RecentItem[] }) {
  return (
    <section className="mt-10">
      <div className="flex items-baseline gap-3 mb-3">
        <h2 className="text-lg font-semibold">Continue where you left off</h2>
        <span className="text-xs text-zinc-500">Pick up the threads you&rsquo;ve already started.</span>
      </div>
      {items.length === 0 ? (
        <div className="rounded-2xl p-6 text-center text-sm text-zinc-500 border border-dashed border-zinc-300 dark:border-zinc-700 bg-white/40 dark:bg-zinc-900/40">
          No activity yet — start with a system design problem or a behavioral question.
        </div>
      ) : (
        <ul className="rounded-2xl bg-white dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800 ring-1 ring-zinc-900/5 dark:ring-white/5 shadow-sm shadow-zinc-900/5 dark:shadow-black/40 divide-y divide-zinc-100 dark:divide-zinc-800/70 overflow-hidden">
          {items.map((item, i) => (
            <ActivityRow key={`${item.module}-${item.kind}-${i}`} item={item} />
          ))}
        </ul>
      )}
    </section>
  );
}
