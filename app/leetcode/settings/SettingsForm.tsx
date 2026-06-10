"use client";

import { useState, useTransition } from "react";
import { RefreshCw, Save, Trash2, KeyRound, ChevronDown } from "lucide-react";
import { saveCredentials, clearCredentials, triggerSync } from "./actions";

type Cred = {
  sessionCookie: string;
  csrfToken: string;
  username: string | null;
  lastSyncAt: Date | null;
} | null;

const PANEL =
  "rounded-2xl bg-white dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800 ring-1 ring-zinc-900/5 dark:ring-white/5 shadow-sm shadow-zinc-900/5 dark:shadow-black/40";

const FIELD =
  "w-full font-mono text-xs rounded-xl border border-zinc-200/80 dark:border-zinc-800 ring-1 ring-zinc-900/5 dark:ring-white/5 bg-white dark:bg-zinc-900/60 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50";

const PRIMARY_BTN =
  "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-b from-amber-400 to-amber-500 text-zinc-950 shadow-sm shadow-amber-500/40 hover:from-amber-300 hover:to-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition";

const SECONDARY_BTN =
  "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900 disabled:opacity-50 transition";

export function SettingsForm({ credential }: { credential: Cred }) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const hasCreds = !!credential?.sessionCookie;

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
            const r = await saveCredentials(fd);
            setStatus(r.ok ? "Credentials saved." : r.error ?? "Save failed", !r.ok);
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
            <KeyRound size={13} />
          </span>
          Credentials
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">
            LEETCODE_SESSION cookie
          </label>
          <textarea
            name="session"
            required
            rows={3}
            defaultValue={credential?.sessionCookie ?? ""}
            placeholder="Paste the value of your LEETCODE_SESSION cookie"
            className={FIELD}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">
            csrftoken cookie{" "}
            <span className="text-zinc-500 font-normal">
              (optional, auto-fetched on sync)
            </span>
          </label>
          <input
            name="csrf"
            defaultValue={credential?.csrfToken ?? ""}
            placeholder="Paste the value of your csrftoken cookie"
            className={FIELD}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={pending} className={PRIMARY_BTN}>
            <Save size={14} />
            {pending ? "Saving…" : "Save credentials"}
          </button>
          {hasCreds && (
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  setStatus("");
                  await clearCredentials();
                  setStatus("Credentials cleared.");
                })
              }
              className={SECONDARY_BTN}
            >
              <Trash2 size={14} /> Clear
            </button>
          )}
        </div>
      </form>

      <div className={`${PANEL} p-5 relative overflow-hidden`}>
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/70 to-transparent"
        />
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-400 mb-3">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
            <RefreshCw size={13} />
          </span>
          Sync from LeetCode
        </div>
        <p className="text-sm text-zinc-500 mb-4">
          Pulls the problem catalog and your recent submissions. May take 30–60s the first time.
          {credential?.lastSyncAt && (
            <>
              {" "}Last sync:{" "}
              <span className="text-zinc-700 dark:text-zinc-300">
                {new Date(credential.lastSyncAt).toLocaleString()}
              </span>.
            </>
          )}
          {credential?.username && (
            <>
              {" "}Logged in as{" "}
              <span className="font-semibold text-amber-700 dark:text-amber-400">
                {credential.username}
              </span>.
            </>
          )}
        </p>
        <button
          type="button"
          disabled={pending || !hasCreds}
          onClick={() =>
            start(async () => {
              setStatus("Syncing… (this can take a while)");
              const r = await triggerSync();
              if (r.ok) {
                setStatus(
                  `Synced ${r.result.problemsUpserted} problems, ${r.result.submissionsUpserted} submissions in ${(r.result.durationMs / 1000).toFixed(1)}s.`
                );
              } else {
                setStatus(`Sync failed: ${r.error}`, true);
              }
            })
          }
          className={PRIMARY_BTN}
        >
          <RefreshCw size={14} className={pending ? "animate-spin" : ""} />
          {pending ? "Working…" : "Sync now"}
        </button>
      </div>

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

      <details className={`${PANEL} text-sm group`}>
        <summary className="cursor-pointer flex items-center justify-between px-5 py-3 text-zinc-600 dark:text-zinc-400 list-none [&::-webkit-details-marker]:hidden">
          <span className="font-medium">How do I find these cookies?</span>
          <ChevronDown size={14} className="transition-transform group-open:rotate-180" />
        </summary>
        <ol className="list-decimal pl-9 pr-5 pb-4 space-y-1.5 text-zinc-600 dark:text-zinc-400">
          <li>
            Open{" "}
            <code className="text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800/70 text-amber-700 dark:text-amber-400">
              leetcode.com
            </code>{" "}
            and log in.
          </li>
          <li>
            Open browser DevTools → Application (Chrome) or Storage (Firefox) → Cookies → leetcode.com.
          </li>
          <li>
            Copy the value of{" "}
            <code className="text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800/70 text-amber-700 dark:text-amber-400">
              LEETCODE_SESSION
            </code>{" "}
            and paste above.
          </li>
          <li>
            (Optional) Copy{" "}
            <code className="text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800/70 text-amber-700 dark:text-amber-400">
              csrftoken
            </code>{" "}
            too, otherwise the library will fetch one on each sync.
          </li>
        </ol>
      </details>
    </div>
  );
}
