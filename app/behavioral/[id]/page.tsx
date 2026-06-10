import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { db } from "@/lib/db";
import { StarForm } from "./StarForm";

export const dynamic = "force-dynamic";

export default async function BehavioralDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const question = await db.behavioralQuestion.findUnique({
    where: { id },
    include: { category: true, answers: true },
  });
  if (!question) notFound();

  const answer = question.answers[0];
  const initial = {
    situation: answer?.situation ?? "",
    task: answer?.task ?? "",
    action: answer?.action ?? "",
    result: answer?.result ?? "",
    projectTag: answer?.projectTag ?? "",
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <Link
          href="/behavioral"
          className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400 transition mb-3"
        >
          <ChevronLeft size={14} /> Back to questions
        </Link>
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-500">
          {question.category.name}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">{question.text}</h1>
      </div>
      <StarForm questionId={question.id} initial={initial} />
    </div>
  );
}
