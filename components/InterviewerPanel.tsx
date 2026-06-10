"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Send, RotateCcw, AlertCircle, Loader2, Camera, Check } from "lucide-react";
import { resetConversation } from "@/app/system-design/[slug]/actions";
import { formatTranscript } from "@/lib/ai/snapshot";

export type InterviewMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  diagramLabel: string | null;
};

type GetSnapshot = () => Promise<{ png: string | null; label: string | null }>;

type SaveSnapshotInput = {
  transcript: string;
  diagramPngBase64: string | null;
  diagramLabel: string | null;
  messageCount: number;
};

export function InterviewerPanel({
  problemId,
  slug,
  problemTitle,
  initialMessages,
  getSnapshot,
  isActive = true,
  onSaveSnapshot,
}: {
  problemId: string;
  slug: string;
  problemTitle: string;
  initialMessages: InterviewMessage[];
  getSnapshot: GetSnapshot;
  /**
   * Whether the panel is currently the active tab. When false the panel is
   * still mounted (so state is preserved) but won't auto-greet. Defaults to
   * true for callers that don't tab.
   */
  isActive?: boolean;
  /** Called when the user clicks Save snapshot. */
  onSaveSnapshot?: (input: SaveSnapshotInput) => void | Promise<void>;
}) {
  const [messages, setMessages] = useState<InterviewMessage[]>(initialMessages);
  const [streaming, setStreaming] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const greetedRef = useRef(false);

  // Auto-scroll transcript on update
  useEffect(() => {
    transcriptRef.current?.scrollTo({
      top: transcriptRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, streaming]);

  // Auto-greet on empty conversation. Defers until the panel is actually the
  // active tab so we don't fire a kickoff API call on every workspace load
  // for users who never open the Interviewer.
  useEffect(() => {
    if (!isActive) return;
    if (greetedRef.current) return;
    if (messages.length > 0) {
      greetedRef.current = true;
      return;
    }
    greetedRef.current = true;
    // Defer to next tick so the panel paints cleanly first.
    setTimeout(() => {
      void runRequest({ kickoff: true });
    }, 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  async function runRequest({
    kickoff,
    text,
  }: {
    kickoff?: boolean;
    text?: string;
  }) {
    if (pending) return;
    setPending(true);
    setError(null);

    let snapshot: { png: string | null; label: string | null } = {
      png: null,
      label: null,
    };
    try {
      snapshot = await getSnapshot();
    } catch (err) {
      console.warn("Snapshot failed:", err);
    }

    // Optimistically append the user message (skip for kickoff — it's synthetic).
    if (!kickoff && text) {
      setMessages((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          role: "user",
          content: text,
          diagramLabel: snapshot.label,
        },
      ]);
    }

    setStreaming("");

    try {
      const resp = await fetch("/api/ai/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId,
          message: text,
          kickoff: !!kickoff,
          diagramPngBase64: snapshot.png,
          diagramLabel: snapshot.label,
        }),
      });

      if (!resp.ok || !resp.body) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${resp.status}`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Split SSE frames
        let idx;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const frame = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 2);
          if (!frame.startsWith("data:")) continue;
          const payload = frame.slice(5).trim();
          try {
            const event = JSON.parse(payload);
            if (event.type === "delta" && typeof event.text === "string") {
              assistantText += event.text;
              setStreaming(assistantText);
            } else if (event.type === "error") {
              throw new Error(event.error ?? "Unknown error");
            } else if (event.type === "done") {
              // Server has persisted both messages; mirror in local state.
              setMessages((prev) => [
                ...prev,
                {
                  id: `local-assistant-${Date.now()}`,
                  role: "assistant",
                  content: assistantText,
                  diagramLabel: null,
                },
              ]);
              setStreaming(null);
            }
          } catch (e) {
            throw e;
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Request failed.";
      setError(msg);
      setStreaming(null);
      // Roll back the optimistic user message — easier than tracking IDs.
      if (!kickoff && text) {
        setMessages((prev) => prev.slice(0, -1));
      }
    } finally {
      setPending(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    await runRequest({ text });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void onSubmit(e as unknown as React.FormEvent);
    }
  }

  async function onReset() {
    if (!confirm("Reset the interview? The transcript will be cleared.")) return;
    await resetConversation(problemId, slug);
    setMessages([]);
    setStreaming(null);
    setError(null);
    greetedRef.current = false;
    setTimeout(() => {
      void runRequest({ kickoff: true });
    }, 50);
  }

  const [savingSnapshot, setSavingSnapshot] = useState(false);
  const [snapshotConfirmedAt, setSnapshotConfirmedAt] = useState<number | null>(null);

  async function onSave() {
    if (savingSnapshot || !onSaveSnapshot) return;
    setSavingSnapshot(true);
    try {
      const snap = await getSnapshot();
      const transcript = formatTranscript(
        messages.map((m) => ({ role: m.role, content: m.content })),
        problemTitle
      );
      await onSaveSnapshot({
        transcript,
        diagramPngBase64: snap.png,
        diagramLabel: snap.label,
        messageCount: messages.length,
      });
      setSnapshotConfirmedAt(Date.now());
      // Clear the "saved" indicator after a few seconds.
      setTimeout(() => setSnapshotConfirmedAt(null), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSavingSnapshot(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-400">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
            <Sparkles size={13} />
          </span>
          Interviewer
        </div>
        {messages.length > 0 && (
          <div className="flex items-center gap-3">
            {onSaveSnapshot && (
              <button
                type="button"
                onClick={onSave}
                disabled={pending || savingSnapshot}
                className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400 disabled:opacity-50 transition"
                title="Save snapshot of chat + current diagram"
              >
                {savingSnapshot ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : snapshotConfirmedAt ? (
                  <Check size={12} className="text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Camera size={12} />
                )}
                {savingSnapshot
                  ? "Saving…"
                  : snapshotConfirmedAt
                  ? "Saved"
                  : "Save snapshot"}
              </button>
            )}
            <button
              type="button"
              onClick={onReset}
              disabled={pending}
              className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 disabled:opacity-50 transition"
              title="Reset interview"
            >
              <RotateCcw size={12} /> Restart
            </button>
          </div>
        )}
      </div>

      <div
        ref={transcriptRef}
        className="flex-1 min-h-0 overflow-y-auto rounded-2xl bg-white dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800 ring-1 ring-zinc-900/5 dark:ring-white/5 shadow-sm shadow-zinc-900/5 dark:shadow-black/40 p-3 space-y-3"
      >
        {messages.length === 0 && !streaming && !error && (
          <div className="text-xs text-zinc-500 px-2 py-1">
            <Loader2 size={12} className="inline animate-spin mr-1" />
            Setting up your interviewer…
          </div>
        )}
        {messages.map((m) => (
          <Bubble key={m.id} role={m.role} content={m.content} />
        ))}
        {streaming !== null && (
          <Bubble role="assistant" content={streaming} streaming />
        )}
        {error && (
          <div className="rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs px-3 py-2 flex items-start gap-2">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} className="mt-3 flex flex-col gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask a question or describe your next step… (⌘/Ctrl+Enter to send)"
          rows={2}
          disabled={pending}
          className="w-full text-sm rounded-xl border border-zinc-200/80 dark:border-zinc-800 ring-1 ring-zinc-900/5 dark:ring-white/5 bg-white dark:bg-zinc-900/70 px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50 disabled:opacity-60"
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-zinc-500">
            The interviewer sees the current diagram on every turn.
          </span>
          <button
            type="submit"
            disabled={pending || !input.trim()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-b from-amber-400 to-amber-500 text-zinc-950 shadow-sm shadow-amber-500/40 hover:from-amber-300 hover:to-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {pending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            {pending ? "Thinking…" : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Bubble({
  role,
  content,
  streaming,
}: {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[90%] text-sm rounded-2xl px-3 py-2 ${
          isUser
            ? "bg-amber-500/10 text-amber-900 dark:bg-amber-400/15 dark:text-amber-100 ring-1 ring-amber-500/20"
            : "bg-zinc-100/70 text-zinc-800 dark:bg-zinc-800/70 dark:text-zinc-100"
        }`}
      >
        <div className="whitespace-pre-wrap break-words">
          {content}
          {streaming && (
            <span className="inline-block w-1.5 h-4 ml-0.5 align-middle bg-amber-500 dark:bg-amber-400 animate-pulse rounded-sm" />
          )}
        </div>
      </div>
    </div>
  );
}
