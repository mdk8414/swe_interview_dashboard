import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { db } from "@/lib/db";
import { DesignWorkspace } from "./DesignWorkspace";

export const dynamic = "force-dynamic";

export default async function SystemDesignDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const problem = await db.systemDesignProblem.findUnique({
    where: { slug },
    include: {
      diagrams: { orderBy: { updatedAt: "asc" } },
      conversation: {
        include: { messages: { orderBy: { createdAt: "asc" } } },
      },
      snapshots: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!problem) notFound();

  const initialMessages = (problem.conversation?.messages ?? []).map((m) => ({
    id: m.id,
    role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
    content: m.content,
    diagramLabel: m.diagramLabel,
  }));

  const initialSnapshots = problem.snapshots.map((s) => ({
    id: s.id,
    name: s.name,
    transcript: s.transcript,
    diagramPng: s.diagramPng,
    diagramLabel: s.diagramLabel,
    messageCount: s.messageCount,
    createdAt: s.createdAt.toISOString(),
  }));

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <Link
          href="/system-design"
          className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400 transition mb-3"
        >
          <ChevronLeft size={14} /> Back to problems
        </Link>
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-500 mb-1">
          System Design
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{problem.title}</h1>
      </div>
      <DesignWorkspace
        problemId={problem.id}
        problemTitle={problem.title}
        slug={problem.slug}
        prompt={problem.prompt}
        initialNotes={problem.notes ?? ""}
        initialDiagrams={problem.diagrams.map((d) => ({
          id: d.id,
          label: d.label,
          sceneJson: d.sceneJson,
        }))}
        initialMessages={initialMessages}
        initialSnapshots={initialSnapshots}
      />
    </div>
  );
}
