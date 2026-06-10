"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Code2, GitBranch, MessageSquare, LayoutDashboard, Settings, Shirt } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leetcode", label: "LeetCode", icon: Code2 },
  { href: "/system-design", label: "System Design", icon: GitBranch },
  { href: "/behavioral", label: "Behavioral", icon: MessageSquare },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col w-56 border-r border-zinc-200/70 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-sm p-4 gap-1 shrink-0">
      <div className="flex items-center gap-2 px-2 pb-4 mb-1">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 shadow-sm shadow-amber-500/40">
          <Shirt size={16} />
        </span>
        <span className="text-base font-bold tracking-tight">Sweatshirt</span>
      </div>
      {links.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition group",
              active
                ? "bg-amber-500/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300 ring-1 ring-amber-500/20 dark:ring-amber-400/20"
                : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/70 dark:hover:bg-zinc-900/70"
            )}
          >
            {active && (
              <span
                aria-hidden
                className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-amber-500 dark:bg-amber-400"
              />
            )}
            <Icon
              size={16}
              className={cn(
                active
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300"
              )}
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
