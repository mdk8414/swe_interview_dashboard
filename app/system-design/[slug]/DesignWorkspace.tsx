"use client";

import { useRef, useState, useTransition } from "react";
import {
  Plus,
  Trash2,
  NotebookPen,
  MessagesSquare,
  History,
  ImageOff,
} from "lucide-react";
import ExcalidrawCanvas, { type ExcalidrawCanvasHandle } from "@/components/ExcalidrawCanvas";
import { InterviewerPanel, type InterviewMessage } from "@/components/InterviewerPanel";
import { HistoryPanel, type SnapshotSummary } from "@/components/HistoryPanel";
import {
  saveNotes,
  saveDiagram,
  createDiagram,
  deleteDiagram,
  saveSnapshot,
  renameSnapshot,
  deleteSnapshot,
} from "./actions";

type Diagram = { id: string; label: string; sceneJson: string };

const SECTION_LABEL =
  "text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.15em] mb-2";

const PANEL =
  "rounded-2xl bg-white dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800 ring-1 ring-zinc-900/5 dark:ring-white/5 shadow-sm shadow-zinc-900/5 dark:shadow-black/40";

type LeftTab = "notes" | "interviewer" | "history";

export function DesignWorkspace({
  problemId,
  problemTitle,
  slug,
  prompt,
  initialNotes,
  initialDiagrams,
  initialMessages,
  initialSnapshots,
}: {
  problemId: string;
  problemTitle: string;
  slug: string;
  prompt: string;
  initialNotes: string;
  initialDiagrams: Diagram[];
  initialMessages: InterviewMessage[];
  initialSnapshots: SnapshotSummary[];
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [diagrams, setDiagrams] = useState<Diagram[]>(initialDiagrams);
  const [activeId, setActiveId] = useState<string | null>(
    initialDiagrams[0]?.id ?? null
  );
  const [leftTab, setLeftTab] = useState<LeftTab>("notes");
  const [snapshots, setSnapshots] = useState<SnapshotSummary[]>(initialSnapshots);
  const [activeSnapshotId, setActiveSnapshotId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const canvasRef = useRef<ExcalidrawCanvasHandle>(null);

  const flushNotes = (val: string) => {
    setNotes(val);
    startTransition(() => {
      void saveNotes(slug, val);
    });
  };

  const onAddDiagram = async () => {
    const label = prompt_for_label(diagrams.length);
    const id = await createDiagram(problemId, label);
    const newDiagram: Diagram = {
      id,
      label,
      sceneJson: JSON.stringify({ elements: [], appState: {}, files: {} }),
    };
    setDiagrams((d) => [...d, newDiagram]);
    setActiveId(id);
  };

  const onDeleteDiagram = async (id: string) => {
    if (!confirm("Delete this diagram?")) return;
    await deleteDiagram(id);
    setDiagrams((d) => d.filter((x) => x.id !== id));
    if (activeId === id) {
      const remaining = diagrams.filter((x) => x.id !== id);
      setActiveId(remaining[0]?.id ?? null);
    }
  };

  const active = diagrams.find((d) => d.id === activeId) ?? null;
  const activeSnapshot = activeSnapshotId
    ? snapshots.find((s) => s.id === activeSnapshotId) ?? null
    : null;

  // Lets InterviewerPanel ask for a PNG snapshot of the currently visible canvas.
  const getSnapshot = async () => {
    const png = (await canvasRef.current?.exportPng()) ?? null;
    return { png, label: active?.label ?? null };
  };

  // Called by InterviewerPanel when the user clicks "Save snapshot".
  // The panel formats the transcript and provides the PNG; we just persist
  // and update local snapshot state.
  const onSaveSnapshot = async (input: {
    transcript: string;
    diagramPngBase64: string | null;
    diagramLabel: string | null;
    messageCount: number;
  }) => {
    const r = await saveSnapshot(problemId, slug, input);
    if (r.ok) {
      setSnapshots((prev) => [
        {
          id: r.id,
          name: null,
          transcript: input.transcript,
          diagramPng: input.diagramPngBase64,
          diagramLabel: input.diagramLabel,
          messageCount: input.messageCount,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    }
  };

  const onRenameSnapshot = async (id: string, name: string) => {
    await renameSnapshot(id, slug, name);
    const trimmed = name.trim();
    setSnapshots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name: trimmed.length > 0 ? trimmed : null } : s))
    );
  };

  const onDeleteSnapshot = async (id: string) => {
    await deleteSnapshot(id, slug);
    setSnapshots((prev) => prev.filter((s) => s.id !== id));
    if (activeSnapshotId === id) setActiveSnapshotId(null);
  };

  const switchLeftTab = (tab: LeftTab) => {
    setLeftTab(tab);
    // Switching to Notes or Interviewer exits any active snapshot review.
    if (tab !== "history") setActiveSnapshotId(null);
  };

  return (
    <div className="grid grid-cols-12 gap-4 h-[calc(100vh-9rem)]">
      <div className="col-span-4 flex flex-col gap-3 overflow-hidden min-h-0">
        <div className={`${PANEL} p-4 relative overflow-hidden shrink-0`}>
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/70 to-transparent"
          />
          <h3 className={SECTION_LABEL}>Prompt</h3>
          <p className="text-sm whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
            {prompt}
          </p>
        </div>

        <div className="flex gap-1 shrink-0" role="tablist" aria-label="Left panel">
          <TabButton
            active={leftTab === "notes"}
            onClick={() => switchLeftTab("notes")}
            Icon={NotebookPen}
            label="Notes"
          />
          <TabButton
            active={leftTab === "interviewer"}
            onClick={() => switchLeftTab("interviewer")}
            Icon={MessagesSquare}
            label="Interviewer"
          />
          <TabButton
            active={leftTab === "history"}
            onClick={() => switchLeftTab("history")}
            Icon={History}
            label="History"
            badge={snapshots.length > 0 ? snapshots.length : undefined}
          />
        </div>

        {/* All three panels stay mounted across tab switches so their state
            (chat history, draft input, in-flight stream, scroll position)
            persists. Hide inactive panels via CSS. */}
        <div className="flex-1 min-h-0 overflow-hidden relative">
          <div className={leftTab === "notes" ? "h-full" : "hidden"}>
            <textarea
              value={notes}
              onChange={(e) => flushNotes(e.target.value)}
              placeholder="Capacity estimates, API sketches, trade-offs…"
              className="h-full w-full font-mono text-xs rounded-2xl border border-zinc-200/80 dark:border-zinc-800 ring-1 ring-zinc-900/5 dark:ring-white/5 shadow-sm shadow-zinc-900/5 dark:shadow-black/40 bg-white dark:bg-zinc-900/70 px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50"
            />
          </div>
          <div className={leftTab === "interviewer" ? "h-full" : "hidden"}>
            <InterviewerPanel
              problemId={problemId}
              slug={slug}
              problemTitle={problemTitle}
              initialMessages={initialMessages}
              getSnapshot={getSnapshot}
              isActive={leftTab === "interviewer"}
              onSaveSnapshot={onSaveSnapshot}
            />
          </div>
          <div className={leftTab === "history" ? "h-full" : "hidden"}>
            <HistoryPanel
              snapshots={snapshots}
              activeSnapshotId={activeSnapshotId}
              onSelect={setActiveSnapshotId}
              onClear={() => setActiveSnapshotId(null)}
              onRename={onRenameSnapshot}
              onDelete={onDeleteSnapshot}
            />
          </div>
        </div>
      </div>

      <div className={`col-span-8 flex flex-col ${PANEL} overflow-hidden`}>
        {activeSnapshot ? (
          <SnapshotImageView snapshot={activeSnapshot} />
        ) : (
          <>
            <div className="flex items-center gap-1 border-b border-zinc-200/80 dark:border-zinc-800 px-3 py-2 bg-zinc-50/60 dark:bg-zinc-900/40 overflow-x-auto">
              {diagrams.map((d) => (
                <div
                  key={d.id}
                  className={`group flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs cursor-pointer transition ${
                    d.id === activeId
                      ? "bg-amber-500/10 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300 ring-1 ring-amber-500/30"
                      : "hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400"
                  }`}
                  onClick={() => setActiveId(d.id)}
                >
                  <span className="font-medium">{d.label}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      void onDeleteDiagram(d.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-rose-500 transition"
                    aria-label={`Delete ${d.label}`}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              <button
                onClick={onAddDiagram}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs hover:bg-amber-500/10 hover:text-amber-700 dark:hover:bg-amber-400/15 dark:hover:text-amber-300 text-zinc-600 dark:text-zinc-400 transition"
              >
                <Plus size={12} /> New diagram
              </button>
            </div>

            <div className="flex-1 bg-white dark:bg-zinc-900/30">
              {active ? (
                <ExcalidrawCanvas
                  key={active.id}
                  ref={canvasRef}
                  diagramId={active.id}
                  initialSceneJson={active.sceneJson}
                  onSave={saveDiagram}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-zinc-500">
                  <div className="text-center">
                    <p className="mb-3">No diagrams yet.</p>
                    <button
                      onClick={onAddDiagram}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-b from-amber-400 to-amber-500 text-zinc-950 text-sm font-semibold shadow-sm shadow-amber-500/40 hover:from-amber-300 hover:to-amber-400 transition"
                    >
                      <Plus size={14} /> Create first diagram
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SnapshotImageView({ snapshot }: { snapshot: SnapshotSummary }) {
  return (
    <>
      <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800 px-4 py-2 bg-zinc-50/60 dark:bg-zinc-900/40">
        <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-amber-600 dark:text-amber-500">
          Snapshot · {new Date(snapshot.createdAt).toLocaleString()}
          {snapshot.diagramLabel && (
            <span className="text-zinc-500 ml-2">· {snapshot.diagramLabel}</span>
          )}
        </div>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wide font-semibold bg-zinc-100 text-zinc-500 dark:bg-zinc-800/70 dark:text-zinc-400">
          Read-only
        </span>
      </div>
      <div className="flex-1 bg-white dark:bg-zinc-900/30 overflow-auto flex items-center justify-center p-4">
        {snapshot.diagramPng ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`data:image/png;base64,${snapshot.diagramPng}`}
            alt="Saved diagram"
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <div className="text-center text-sm text-zinc-500">
            <ImageOff size={24} className="mx-auto mb-2 text-zinc-400" />
            No diagram captured at this snapshot.
          </div>
        )}
      </div>
    </>
  );
}

function TabButton({
  active,
  onClick,
  Icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  Icon: typeof NotebookPen;
  label: string;
  badge?: number;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
        active
          ? "bg-amber-500/10 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300 ring-1 ring-amber-500/30"
          : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-700 dark:hover:text-zinc-200"
      }`}
    >
      <Icon size={13} />
      {label}
      {badge !== undefined && (
        <span className="ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500/20 text-amber-700 dark:bg-amber-400/20 dark:text-amber-300 text-[10px] font-bold">
          {badge}
        </span>
      )}
    </button>
  );
}

function prompt_for_label(n: number) {
  return `v${n + 1}`;
}
