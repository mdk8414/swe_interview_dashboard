# Sync & Credentials

*LeetCode has no public API. To know what you've solved, the app uses your own `LEETCODE_SESSION` cookie to hit LeetCode's GraphQL endpoint via the [leetcode-query](https://www.npmjs.com/package/leetcode-query) library. Sync is manual (button in `/settings`) and idempotent.*

## Why

Anonymous LeetCode data (the problem catalog) is free. Your solved-status data requires authentication, and the only auth path that doesn't involve scraping is the session cookie your browser already holds. So the app asks for that cookie, never sends it anywhere except `api.leetcode.com`, and uses it to build the catalog + solved view.

## Credential flow

The settings page at `/settings` ([app/settings/page.tsx](../../../app/settings/page.tsx)) hosts the LeetCode section via the existing [SettingsForm](../../../app/leetcode/settings/SettingsForm.tsx). The form accepts:

- **`LEETCODE_SESSION` cookie** — required. The user copies it from their browser DevTools.
- **`csrftoken` cookie** — optional. If left blank, `leetcode-query`'s `Credential.init(session)` auto-fetches one on each sync.

Both fields are upserted to the `LeetCodeCredential` row via the [saveCredentials](../../../app/leetcode/settings/actions.ts) server action. Storage is plaintext in `prisma/dev.db` — see [Credentials & Privacy](../../architecture/credentials-and-privacy.md).

A **Sync now** button on the same form triggers the sync flow as a server action (`triggerSync` in [app/leetcode/settings/actions.ts](../../../app/leetcode/settings/actions.ts)). There's also a parallel `POST /api/leetcode/sync` route ([app/api/leetcode/sync/route.ts](../../../app/api/leetcode/sync/route.ts)) that does the same work from a `curl` — both call into [lib/leetcode/sync.ts](../../../lib/leetcode/sync.ts).

## Sync flow

`runSync()` in [lib/leetcode/sync.ts](../../../lib/leetcode/sync.ts) does three things, in order:

### 1. Resolve identity

`client.whoami()` to confirm the cookie is valid and stash the resolved `username` on the credential row.

### 2. Catalog pull

Paginates `client.problems({ category: "all-code-essentials" })` 100 at a time, up to 30 pages (so up to 3,000 problems — well above the current catalog size). For each problem:

- Upsert the `LeetCodeProblem` row by `id` (which is the LeetCode question id).
- Encode tags as a JSON string (SQLite has no array type).
- If LeetCode reports `status === "ac"` (you've solved it) and we don't already have an `ACCEPTED` submission for that problem, insert a **synthetic** `LeetCodeSubmission` row with `language: "unknown"` and the current time. This keeps the dashboard's "solved count" honest before step 3 has populated real submission rows.

### 3. Recent submissions

Pull the most recent 50 authenticated submissions via `client.submissions({ limit: 50 })`. For each:

- Look up the problem by slug. Skip if not in the catalog.
- Compose an `id` from `${problemId}-${timestamp}-${lang}` so the upsert is idempotent across re-syncs.
- Upsert into `LeetCodeSubmission` with the real `submittedAt`, `status`, and `language`.

Failures in this step are caught and logged — the catalog data still lands. (Anecdotally, the submissions endpoint occasionally 401s on cookie issues; the catalog still works in that case.)

### 4. Update `lastSyncAt`

So the UI can show "Last sync: 12:34 PM today" on the settings page.

## Rate limiting

`leetcode-query` has a built-in `RateLimiter` that defaults to 20 concurrent in-flight requests, so a full sync of ~3,000 problems takes ~30–60 seconds the first time and much less on subsequent runs (since they're mostly idempotent upserts on already-cached prefixes).

## Design decisions

- **Manual sync, not background sync.** A scheduled sync would need either a long-running process or a cron, both of which break the "single-process Next.js dev server" model. Manual is fine — the user knows when they've just submitted on LeetCode.
- **Synthetic submission for `status: "ac"`.** Without it, the dashboard would show 0 solved until step 3 ran for the first time. With it, the dashboard is correct immediately after step 2, and step 3 just upgrades the language/timestamp accuracy.
- **Composite `id` for submission rows.** Using `cuid()` would make re-syncs duplicative; deriving the id from `(problemId, timestamp, lang)` makes upserts naturally idempotent.

## Key files

- [app/leetcode/settings/SettingsForm.tsx](../../../app/leetcode/settings/SettingsForm.tsx) — the credential form + Sync button.
- [app/leetcode/settings/actions.ts](../../../app/leetcode/settings/actions.ts) — `saveCredentials`, `clearCredentials`, `triggerSync` server actions.
- [app/api/leetcode/sync/route.ts](../../../app/api/leetcode/sync/route.ts) — `POST` route, mirrors the server action.
- [lib/leetcode/sync.ts](../../../lib/leetcode/sync.ts) — the `runSync()` implementation.
- [lib/leetcode/client.ts](../../../lib/leetcode/client.ts) — thin wrapper that builds an authenticated `leetcode-query` client from the stored credential.

## Related

- [Credentials & Privacy](../../architecture/credentials-and-privacy.md) — what the LeetCode cookie permits and where it's stored.
- [Problem list](problem-list.md) — what the synced data drives.
- [Stats & gap analysis](stats-and-gap-analysis.md) — analysis layered on top of the synced data.
