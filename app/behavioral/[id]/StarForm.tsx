"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { Check } from "lucide-react";
import { saveAnswer } from "./actions";

type Fields = {
  situation: string;
  task: string;
  action: string;
  result: string;
  projectTag: string;
};

const FIELD_BASE =
  "w-full text-sm rounded-xl border border-zinc-200/80 dark:border-zinc-800 ring-1 ring-zinc-900/5 dark:ring-white/5 shadow-sm shadow-zinc-900/5 dark:shadow-black/40 bg-white dark:bg-zinc-900/70 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50";

export function StarForm({
  questionId,
  initial,
}: {
  questionId: string;
  initial: Fields;
}) {
  const [fields, setFields] = useState<Fields>(initial);
  const [, start] = useTransition();
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const debouncedRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const update = (k: keyof Fields, v: string) => {
    const next = { ...fields, [k]: v };
    setFields(next);
    if (debouncedRef.current) clearTimeout(debouncedRef.current);
    debouncedRef.current = setTimeout(() => {
      start(async () => {
        await saveAnswer(questionId, next);
        setSavedAt(new Date());
      });
    }, 700);
  };

  useEffect(() => {
    return () => {
      if (debouncedRef.current) clearTimeout(debouncedRef.current);
    };
  }, []);

  const filled = [fields.situation, fields.task, fields.action, fields.result].filter(Boolean).length;
  const ratio = filled / 4;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-zinc-200/70 dark:bg-zinc-800/70 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all"
            style={{ width: `${ratio * 100}%` }}
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500 shrink-0">
          <span className="font-mono text-zinc-700 dark:text-zinc-300">{filled} / 4</span>
          <span>filled</span>
          {savedAt && (
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <Check size={11} /> {savedAt.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      <Field
        label="Situation"
        hint="Set the scene. What was happening, when, where?"
        value={fields.situation}
        onChange={(v) => update("situation", v)}
      />
      <Field
        label="Task"
        hint="What was your specific responsibility or goal?"
        value={fields.task}
        onChange={(v) => update("task", v)}
      />
      <Field
        label="Action"
        hint="What did YOU do? Use 'I', not 'we', and be concrete."
        value={fields.action}
        onChange={(v) => update("action", v)}
        rows={6}
      />
      <Field
        label="Result"
        hint="What changed? Quantify if possible."
        value={fields.result}
        onChange={(v) => update("result", v)}
      />

      <div>
        <label className="block">
          <div className="text-sm font-medium">
            Project tag{" "}
            <span className="text-zinc-500 font-normal">
              (optional, used to cross-link projects → questions)
            </span>
          </div>
          <input
            type="text"
            value={fields.projectTag}
            onChange={(e) => update("projectTag", e.target.value)}
            placeholder="e.g. ingest-pipeline-rewrite"
            className={`mt-1 ${FIELD_BASE}`}
          />
        </label>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <label className="block">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-zinc-500 mb-1">{hint}</div>
        <textarea
          value={value}
          rows={rows}
          onChange={(e) => onChange(e.target.value)}
          className={`${FIELD_BASE} resize-y`}
        />
      </label>
    </div>
  );
}
