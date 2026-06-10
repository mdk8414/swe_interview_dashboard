# Credentials & Privacy

*The app stores two secrets locally in plaintext: a LeetCode session cookie and an Anthropic API key. Both live in singleton tables in `prisma/dev.db`, gitignored. Anyone with read access to that file has functional access to both your LeetCode account and your Anthropic billing.*

## Where credentials are stored

| What | Where | Form |
|---|---|---|
| LeetCode session | `LeetCodeCredential` row (id = 1) in `prisma/dev.db` | `sessionCookie` + optional `csrfToken` strings |
| Anthropic API key | `AICredential` row (id = 1) in `prisma/dev.db` | `apiKey` string + `model` (default `claude-sonnet-4-6`) |

Both are managed from the unified `/settings` page ([app/settings/page.tsx](../../app/settings/page.tsx)) via server actions in [app/leetcode/settings/actions.ts](../../app/leetcode/settings/actions.ts) and [app/settings/actions.ts](../../app/settings/actions.ts).

## The trust model

The app assumes a single trusted user on a single machine:

- **No authentication layer** — anyone who can reach `localhost:3000` can read and write all data.
- **No encryption at rest** — the SQLite file is plaintext. Standard SQLite tooling (or `npx prisma studio`) will display the cookies and the API key in full.
- **No transport** — credentials never leave the machine except as outbound calls to LeetCode (`leetcode.com/graphql/`) or Anthropic (`api.anthropic.com`), both over HTTPS via the official SDKs.

This is acceptable for a local dev tool but worth keeping in mind:

- **Don't sync `prisma/dev.db` to a cloud backup that other people can read.** It's gitignored already (`/prisma/*.db` in [.gitignore](../../.gitignore)) so it won't accidentally land in a repo, but Dropbox / iCloud / a shared Time Machine drive are all on the table.
- **A leaked Anthropic key bills your account.** The "Test connection" button in `/settings` makes a single-token call — if you suddenly see usage you didn't make, the key has leaked.
- **A leaked LeetCode session cookie is effectively your LeetCode login** (until you log out and the session is invalidated server-side, or until the cookie expires).

## Outbound calls (what gets sent where)

- **LeetCode** — Every sync sends your session cookie to `leetcode.com/graphql/` to fetch your problem catalog and submissions, via the [leetcode-query](https://www.npmjs.com/package/leetcode-query) library. See [features/leetcode/sync-and-credentials.md](../features/leetcode/sync-and-credentials.md) for the full flow.
- **Anthropic** — Every interviewer turn POSTs to `api.anthropic.com` with your API key, the system prompt, the conversation history, and a base64 PNG of the current Excalidraw scene. See [features/system-design/ai-interviewer.md](../features/system-design/ai-interviewer.md).
- **Nothing else.** No telemetry, no error reporting, no analytics.

## What v2 hardening would look like

Not implemented, but the obvious upgrade paths:

- **Encrypt credentials at rest.** Derive a key from a passphrase the user enters on app start; encrypt the `sessionCookie` and `apiKey` fields with that key. Costs a per-start unlock step.
- **Move the DB out of the repo.** `~/.sweatshirt/db.sqlite` so `rm -rf` on the working tree doesn't destroy data.
- **OS keychain integration.** macOS Keychain / Linux Secret Service for the API key, with the DB only holding a reference.

Each of these adds friction and complexity that hasn't been justified by a real-world threat model yet.

## Related

- [Data Model](data-model.md) — full schema for the two credential tables.
- [LeetCode sync](../features/leetcode/sync-and-credentials.md) — how the LeetCode cookie gets used.
- [AI Interviewer](../features/system-design/ai-interviewer.md) — how the Anthropic key gets used.
