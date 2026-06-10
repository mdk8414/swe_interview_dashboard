# LeetCode Module

*Track your LeetCode practice locally: pull your problem catalog and your solved status using your own session cookie, browse and filter the catalog, see weakness analysis by tag, and get suggestions for what to work on next.*

LeetCode has no public API, so syncing requires the same `LEETCODE_SESSION` cookie your browser uses. Once configured, everything else (catalog, stats, suggestions) is local.

The module has three routes:

| Route | Purpose | Doc |
|---|---|---|
| `/leetcode` | Sortable, filterable problem list | [problem-list.md](problem-list.md) |
| `/leetcode/stats` | Bar charts, weakness ranking, suggested next problems | [stats-and-gap-analysis.md](stats-and-gap-analysis.md) |
| `/settings` (was `/leetcode/settings`) | Cookie input + Sync button | [sync-and-credentials.md](sync-and-credentials.md) |

## Related

- [Data Model](../../architecture/data-model.md) — `LeetCodeProblem`, `LeetCodeSubmission`, `LeetCodeCredential`.
- [Credentials & Privacy](../../architecture/credentials-and-privacy.md) — where the session cookie lives.
- [Dashboard](../dashboard.md) — the LeetCode summary card pulls from this module's analysis.
