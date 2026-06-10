# Documentation Convention

*Every feature change updates a doc. New feature → new doc. Modified feature → updated doc. Deleted feature → deleted doc. If you can't say which doc captures your change, that's a sign the doc is missing — create it.*

## The rule

When you add or modify a feature, you must either:

1. **Update an existing doc** that already covers the area, or
2. **Create a new doc** under `docs/features/<area>/` (or `docs/architecture/` for cross-cutting concerns), and add it to the top-level table of contents in [docs/README.md](../README.md).

The docs are part of the working tree, not an afterthought. Code changes that ship without doc updates are incomplete.

## Which file to update

| Type of change | File to touch |
|---|---|
| New user-facing module (e.g. "Coding patterns") | `docs/features/<module>/README.md` + at least one sub-doc, then add to `docs/README.md` TOC |
| New page or feature within an existing module | Update or add a doc under `docs/features/<module>/` |
| Schema change (new model, new field, removed model) | `docs/architecture/data-model.md` |
| New shared UI primitive or color decision | `docs/architecture/design-system.md` |
| New credential, secret, or external service | `docs/architecture/credentials-and-privacy.md` |
| New file layout convention, request flow change, runtime version bump | `docs/architecture/overview.md` |
| Process or convention (like this file) | `docs/conventions/<name>.md` |

When unsure, default to "feature doc." Architecture docs should change rarely.

## Doc shape

Feature docs follow a consistent template. Match it when adding new ones:

1. **Italic one-liner at the top** — what this is in one breath.
2. **Why** — 2-3 sentences on the problem it solves.
3. **Behavior** — what the user sees + key interactions.
4. **Design decisions** — the non-obvious choices, with reasoning. Include trade-offs you considered and rejected.
5. **Key files** — markdown links to the implementations (`[file](relative/path)`).
6. **Related** — links to sibling docs that touch the same area.

Section-overview docs (the `README.md` inside each feature subdirectory) skip steps 3-4 — they're just navigation to the sub-docs.

## Markdown links

Always use relative paths from the doc to the target:

```markdown
[components/Card.tsx](../../components/Card.tsx)            <!-- from a feature subdir -->
[app/page.tsx](../../app/page.tsx)                          <!-- from features/dashboard.md -->
[Data Model](../architecture/data-model.md)                 <!-- from a features/ doc -->
```

This keeps clicks resolvable from any markdown renderer (GitHub, VS Code preview, Obsidian, etc.) without depending on a site-generator base URL.

## What to leave out

The code is the source of truth. Don't:

- Paste long code snippets (>10 lines).
- Document function signatures or parameter types — that's the code's job.
- Document behavior that's plainly obvious from the file name (`Card.tsx is a card component`).

Do:

- Document the **why** behind decisions, because that's not in the code.
- Document the **non-obvious behavior** — anything a reader couldn't figure out by reading just one file.
- Document the **shape of a feature** so a contributor knows which files to read first.

## Adding a new top-level doc

1. Write the file.
2. Add a link in [docs/README.md](../README.md) under the correct section.
3. Add cross-links from any existing doc that touches the same area (use the "Related" section).
4. If the doc is for a new feature module, also create a `README.md` in its subdirectory that points to the sub-docs.

## Removing a doc

Removing a feature → remove its doc and the TOC entry. Don't leave dead links in `docs/README.md` or in other docs' "Related" sections. A quick `grep` across `docs/` for the old filename catches most of these.

## When working on the codebase, check this list before merging

- [ ] Did this change add or modify a user-facing feature? → Updated or added the relevant feature doc.
- [ ] Did this change touch the Prisma schema? → Updated `docs/architecture/data-model.md`.
- [ ] Did this change introduce a new external service or credential? → Updated `docs/architecture/credentials-and-privacy.md`.
- [ ] Did this change establish a new UI pattern that should be reused? → Updated `docs/architecture/design-system.md`.
- [ ] Did this change move or rename a file referenced from any doc? → Updated the markdown links.
