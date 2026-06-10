import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Card({
  href,
  title,
  children,
  className,
  accent,
}: {
  href?: string;
  title: string;
  children: ReactNode;
  className?: string;
  /** When true, paint a soft amber accent strip along the top of the card. */
  accent?: boolean;
}) {
  const content = (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl p-5 transition duration-200",
        // Layered fill: subtle warm tint over the base panel, denser in dark mode
        "bg-white dark:bg-zinc-900/70",
        // Hairline border + inner ring give depth without a heavy outline
        "border border-zinc-200/80 dark:border-zinc-800",
        "ring-1 ring-zinc-900/5 dark:ring-white/5",
        // Soft shadow lifts the card off the gradient backdrop
        "shadow-sm shadow-zinc-900/5 dark:shadow-black/40",
        href &&
          "cursor-pointer hover:border-amber-300 dark:hover:border-amber-500/50 hover:shadow-md hover:-translate-y-0.5",
        className
      )}
    >
      {accent && (
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/70 to-transparent"
        />
      )}
      <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.15em] mb-3">
        {title}
      </h3>
      <div>{children}</div>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}
