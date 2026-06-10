"use client";

import { useState, useTransition } from "react";
import { Sparkles, Save, Trash2, Zap } from "lucide-react";
import { saveAICredentials, clearAICredentials, testAIConnection } from "./actions";

type AICred = {
  apiKey: string;
  model: string;
} | null;

const PANEL =
  "rounded-2xl bg-white dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800 ring-1 ring-zinc-900/5 dark:ring-white/5 shadow-sm shadow-zinc-900/5 dark:shadow-black/40";

const FIELD =
  "w-full font-mono text-xs rounded-xl border border-zinc-200/80 dark:border-zinc-800 ring-1 ring-zinc-900/5 dark:ring-white/5 bg-white dark:bg-zinc-900/60 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50";

const PRIMARY_BTN =
  "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-b from-amber-400 to-amber-500 text-zinc-950 shadow-sm shadow-amber-500/40 hover:from-amber-300 hover:to-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition";

const SECONDARY_BTN =
  "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900 disabled:opacity-50 transition";

export function AISettingsForm({ credential }: { credential: AICred }) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const hasCreds = !!credential?.apiKey;

  const setStatus = (msg: string, isError = false) => {
    setMessage(msg);
    setError(isError);
  };

  return (
    <div className="space-y-6">
      <form
        action={(fd) =>
          start(async () => {
            setStatus("");
            const r = await saveAICredentials(fd);
            setStatus(r.ok ? "AI credentials saved." : r.error ?? "Save failed", !r.ok);
          })
        }
        className={`${PANEL} p-5 space-y-4 relative overflow-hidden`}
      >
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/70 to-transparent"
        />
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-400">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
            <Sparkles size={13} />
          </span>
          AI / Interviewer
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            Anthropic API key
          </label>
          <input
            type="password"
            name="apiKey"
            required
            defaultValue={credential?.apiKey ?? ""}
            placeholder="sk-ant-…"
            className={FIELD}
            autoComplete="off"
          />
          <p className="text-xs text-zinc-500 mt-1.5">
            Get one at{" "}
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-600 dark:text-amber-400 hover:underline"
            >
              console.anthropic.com
            </a>
            . Stored locally in SQLite, never sent anywhere except Anthropic.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Model</label>
          <input
            name="model"
            defaultValue={credential?.model ?? "claude-sonnet-4-6"}
            className={FIELD}
          />
          <p className="text-xs text-zinc-500 mt-1.5">
            Defaults to <code className="text-amber-700 dark:text-amber-400">claude-sonnet-4-6</code>.
            Swap to any model id your key has access to.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={pending} className={PRIMARY_BTN}>
            <Save size={14} />
            {pending ? "Saving…" : "Save"}
          </button>
          {hasCreds && (
            <>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    setStatus("Testing connection…");
                    const r = await testAIConnection();
                    if (r.ok) {
                      setStatus(`✓ Connected. Model replied as "${r.reply || "(empty)"}" using ${r.model}.`);
                    } else {
                      setStatus(`Test failed: ${r.error}`, true);
                    }
                  })
                }
                className={SECONDARY_BTN}
              >
                <Zap size={14} /> Test connection
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    setStatus("");
                    await clearAICredentials();
                    setStatus("AI credentials cleared.");
                  })
                }
                className={SECONDARY_BTN}
              >
                <Trash2 size={14} /> Clear
              </button>
            </>
          )}
        </div>
      </form>

      {message && (
        <div
          className={`text-sm rounded-xl px-4 py-3 ${
            error
              ? "border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300"
              : "border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200"
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
}
