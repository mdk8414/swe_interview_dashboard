import Link from "next/link";
import { Code2, GitBranch, MessageSquare, ArrowRight, ExternalLink } from "lucide-react";
import type { FocusResult } from "@/lib/dashboard/focus";

const META = {
  leetcode: { label: "LeetCode", Icon: Code2 },
  "system-design": { label: "System Design", Icon: GitBranch },
  behavioral: { label: "Behavioral", Icon: MessageSquare },
} as const;

type ModuleKey = keyof typeof META;

const SHELL_BASE =
  "block relative overflow-hidden rounded-2xl p-4 transition duration-200 " +
  "bg-white dark:bg-zinc-900/70 " +
  "border border-zinc-200/80 dark:border-zinc-800 " +
  "ring-1 ring-zinc-900/5 dark:ring-white/5 " +
  "shadow-sm shadow-zinc-900/5 dark:shadow-black/40";

const SHELL_INTERACTIVE =
  "hover:border-amber-300 dark:hover:border-amber-500/50 hover:shadow-md hover:-translate-y-0.5";

const SHELL_DASHED =
  "block rounded-2xl p-4 border border-dashed border-zinc-300 dark:border-zinc-700 bg-white/40 dark:bg-zinc-900/40";

function ModuleHeader({
  Icon,
  label,
}: {
  Icon: typeof Code2;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400 mb-2">
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
        <Icon size={13} />
      </span>
      {label}
    </div>
  );
}

function FocusSlot({
  moduleKey,
  result,
}: {
  moduleKey: ModuleKey;
  result: FocusResult;
}) {
  const { label, Icon } = META[moduleKey];

  if (result.kind === "empty") {
    return (
      <div className={SHELL_DASHED}>
        <ModuleHeader Icon={Icon} label={label} />
        <p className="text-sm text-zinc-500 mb-3">{result.message}</p>
        {result.href && result.cta && (
          <Link
            href={result.href}
            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
          >
            {result.cta} <ArrowRight size={12} />
          </Link>
        )}
      </div>
    );
  }

  const { item } = result;
  const isExternal = item.href.startsWith("http");
  const ContentTag = isExternal ? "a" : Link;
  const linkProps = isExternal
    ? { href: item.href, target: "_blank", rel: "noopener noreferrer" }
    : { href: item.href };

  return (
    <ContentTag
      {...(linkProps as { href: string; target?: string; rel?: string })}
      className={`group ${SHELL_BASE} ${SHELL_INTERACTIVE}`}
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/70 to-transparent"
      />
      <ModuleHeader Icon={Icon} label={label} />
      <div className="font-medium text-sm line-clamp-2 mb-2">{item.title}</div>
      {item.subtitle && (
        <div className="text-xs text-zinc-500 mb-3">{item.subtitle}</div>
      )}
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300 group-hover:bg-amber-500 group-hover:text-white dark:group-hover:bg-amber-400 dark:group-hover:text-zinc-950 transition">
        {item.cta} {isExternal ? <ExternalLink size={12} /> : <ArrowRight size={12} />}
      </div>
    </ContentTag>
  );
}

export function TodaysFocus({
  focus,
}: {
  focus: { leetcode: FocusResult; "system-design": FocusResult; behavioral: FocusResult };
}) {
  return (
    <section className="mb-8">
      <div className="flex items-baseline gap-3 mb-3">
        <h2 className="text-lg font-semibold">Today&rsquo;s focus</h2>
        <span className="text-xs text-zinc-500">One pick per module to keep momentum.</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <FocusSlot moduleKey="leetcode" result={focus.leetcode} />
        <FocusSlot moduleKey="system-design" result={focus["system-design"]} />
        <FocusSlot moduleKey="behavioral" result={focus.behavioral} />
      </div>
    </section>
  );
}
