"use client";

import { useState } from "react";
import {
  ChevronLeft,
  Pencil,
  Trash2,
  Check,
  X,
  History,
  Camera,
} from "lucide-react";
import { timeAgo } from "@/lib/utils/time";

export type SnapshotSummary = {
  id: string;
  name: string | null;
  transcript: string;
  diagramPng: string | null;
  diagramLabel: string | null;
  messageCount: number;
  createdAt: string; // ISO
};

function displayName(s: SnapshotSummary): string {
  if (s.name && s.name.trim().length > 0) return s.name;
  return new Date(s.createdAt).toLocaleString();
}

function autoSubtitle(s: SnapshotSummary): string {
  const parts: string[] = [];
  parts.push(`${s.messageCount} message${s.messageCount === 1 ? "" : "s"}`);
  if (s.diagramLabel) parts.push(s.diagramLabel);
  return parts.join(" · ");
}

export function HistoryPanel({
  snapshots,
  activeSnapshotId,
  onSelect,
  onClear,
  onRename,
  onDelete,
}: {
  snapshots: SnapshotSummary[];
  activeSnapshotId: string | null;
  onSelect: (id: string) => void;
  onClear: () => void;
  onRename: (id: string, name: string) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}) {
  const active = activeSnapshotId
    ? snapshots.find((s) => s.id === activeSnapshotId) ?? null
    : null;

  if (active) {
    return <DetailMode snapshot={active} onBack={onClear} />;
  }

  return (
    <ListMode
      snapshots={snapshots}
      onSelect={onSelect}
      onRename={onRename}
      onDelete={onDelete}
    />
  );
}

function ListMode({
  snapshots,
  onSelect,
  onRename,
  onDelete,
}: {
  snapshots: SnapshotSummary[];
  onSelect: (id: string) => void;
  onRename: (id: string, name: string) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  if (snapshots.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-400">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
            <History size={13} />
          </span>
          History
        </div>
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <div className="rounded-2xl p-6 text-center text-sm text-zinc-500 border border-dashed border-zinc-300 dark:border-zinc-700 bg-white/40 dark:bg-zinc-900/40">
            <Camera size={20} className="mx-auto mb-2 text-zinc-400" />
            Capture a snapshot from the Interviewer tab to start a record.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-400">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
            <History size={13} />
          </span>
          History
        </div>
        <span className="text-xs text-zinc-500">
          {snapshots.length} snapshot{snapshots.length === 1 ? "" : "s"}
        </span>
      </div>
      <ul className="flex-1 min-h-0 overflow-y-auto rounded-2xl bg-white dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800 ring-1 ring-zinc-900/5 dark:ring-white/5 shadow-sm shadow-zinc-900/5 dark:shadow-black/40 divide-y divide-zinc-100 dark:divide-zinc-800/70">
        {snapshots.map((s) => {
          const isEditing = editingId === s.id;
          return (
            <li
              key={s.id}
              className="group flex items-center gap-2 px-3 py-2.5 hover:bg-amber-50/40 dark:hover:bg-amber-500/5 transition"
            >
              <button
                type="button"
                onClick={() => onSelect(s.id)}
                disabled={isEditing}
                className="flex-1 min-w-0 text-left disabled:cursor-default"
              >
                {isEditing ? (
                  <input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void onRename(s.id, draft);
                        setEditingId(null);
                      } else if (e.key === "Escape") {
                        e.preventDefault();
                        setEditingId(null);
                      }
                    }}
                    placeholder={new Date(s.createdAt).toLocaleString()}
                    className="w-full text-sm font-medium rounded-md border border-amber-300 dark:border-amber-500/50 bg-white dark:bg-zinc-900 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                ) : (
                  <div className="text-sm font-medium truncate">
                    {displayName(s)}
                  </div>
                )}
                <div className="text-xs text-zinc-500 mt-0.5">
                  {timeAgo(new Date(s.createdAt))} · {autoSubtitle(s)}
                </div>
              </button>
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void onRename(s.id, draft);
                      setEditingId(null);
                    }}
                    className="p-1 text-emerald-600 hover:text-emerald-700"
                    aria-label="Save name"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(null);
                    }}
                    className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                    aria-label="Cancel rename"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDraft(s.name ?? "");
                      setEditingId(s.id);
                    }}
                    className="p-1 text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 opacity-0 group-hover:opacity-100 transition"
                    aria-label="Rename snapshot"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Delete this snapshot?")) {
                        void onDelete(s.id);
                      }
                    }}
                    className="p-1 text-zinc-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition"
                    aria-label="Delete snapshot"
                  >
                    <Trash2 size={13} />
                  </button>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function DetailMode({
  snapshot,
  onBack,
}: {
  snapshot: SnapshotSummary;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400 transition"
        >
          <ChevronLeft size={14} /> Back to history
        </button>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wide font-semibold bg-zinc-100 text-zinc-500 dark:bg-zinc-800/70 dark:text-zinc-400">
          Read-only
        </span>
      </div>
      <div className="mb-2">
        <div className="text-sm font-semibold">{displayName(snapshot)}</div>
        <div className="text-xs text-zinc-500">
          {new Date(snapshot.createdAt).toLocaleString()} · {autoSubtitle(snapshot)}
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl bg-white dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800 ring-1 ring-zinc-900/5 dark:ring-white/5 shadow-sm shadow-zinc-900/5 dark:shadow-black/40 p-3">
        <pre className="whitespace-pre-wrap break-words text-xs font-mono text-zinc-700 dark:text-zinc-300">
          {snapshot.transcript}
        </pre>
      </div>
    </div>
  );
}
