# Contributing to Tolatola Client

Thanks for working on this codebase. This document covers the workflow, the
checks that must pass, and the conventions that keep the repo maintainable.

## Table of contents

- [Getting set up](#getting-set-up)
- [The checks](#the-checks)
- [Branching and pull requests](#branching-and-pull-requests)
- [Commit conventions](#commit-conventions)
- [Ship features with their tests](#ship-features-with-their-tests)
- [Writing tests](#writing-tests)
- [Code conventions](#code-conventions)
- [File size and the max-lines ratchet](#file-size-and-the-max-lines-ratchet)
- [Logging and error handling](#logging-and-error-handling)
- [Dependencies](#dependencies)
- [Security](#security)

---

## Getting set up

**npm only.** `package-lock.json` is the single source of truth for dependency
versions. Do not commit a `yarn.lock` or `pnpm-lock.yaml` — the Docker build and
CI both install with `npm ci`, and a second lockfile reintroduces drift between
what you test and what ships.

```bash
git clone <repository-url> && cd Tolatola-Client
npm ci
```

You do **not** need a Supabase project, a backend, or any third-party account to
install, lint, typecheck, test or build. See
[Verifying a fresh clone](./README.md#verifying-a-fresh-clone).

To run the app against a stub backend in one command:

```bash
docker compose up --build
```

## The checks

These run on every pull request via `.github/workflows/ci.yml`, and lint,
typecheck and test run again as a gate in front of the Cloud Run deploy. Run
them locally before pushing:

```bash
npm run lint
npm run format:check
npm run typecheck
npm test
npm run build
```

`npm run format` fixes anything `format:check` reports. Prettier owns
formatting, ESLint owns correctness — do not fight one with the other.

CI also runs a `audit` job. It hard-fails on **critical** advisories and reports
**high** ones without blocking, because every current high advisory is only
fixable by upgrading Next 14 → 16. Promote it to a gate as part of that
upgrade.

- `npm test` enforces a **coverage floor** (`coverageThreshold` in
  `jest.config.js`). If your change lowers coverage below it, the job fails.
  Raise the floor when you add substantial coverage; never lower it.
- `npm run build` must not require real credentials. If it starts needing a
  secret or a live service, that is a regression — the build has to work in a
  clean environment.

## Branching and pull requests

- `main` is the default branch and must stay deployable. Never push to it
  directly.
- Branch from the latest `main`: `feature/checkout-flow`, `fix/profile-avatar`.
- Open a PR into `main`, describe what changed and how to test it, and get **at
  least one review** before merging. Do not merge your own PR unapproved.

## Commit conventions

Use `type(scope): summary` in the imperative mood:

```
fix(checkout): reject a delivery quote with zero weight
feat(admin): add agent commission rate editing
test(lib): cover the ClickPesa token cache
```

Types in use: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `ci`, `build`,
`perf`.

**Keep each commit to one concern.** A commit that mixes reformatting, a
refactor and a behavior change is hard to review and impossible to revert
cleanly. If you reformat a file, do it in its own commit.

Explain *why* in the body when the reason is not obvious from the diff, and call
out behavior changes explicitly.

## Ship features with their tests

**Every commit that changes behavior includes the tests that pin it, in the same
commit** — not in a follow-up PR, not "later".

Concretely, if you touch `components/` or `lib/`, the same commit adds or
updates the matching file under `__tests__/`:

| Change | Test file |
|--------|-----------|
| `lib/checkout/delivery.ts` | `__tests__/lib/checkout/delivery.test.ts` |
| `components/admin/agent-management-tab.tsx` | `__tests__/components/admin/agent-management-tab.test.tsx` |
| `app/api/setup/create-admin/route.ts` | `__tests__/app/api/setup/create-admin.test.ts` |
| `hooks/use-ticket-message-counts.ts` | `__tests__/hooks/use-ticket-message-counts.test.tsx` |

A bug fix should include a test that fails before the fix and passes after it.

## Writing tests

Jest + React Testing Library. Mirror the source path under `__tests__/`.

- **Never touch a live service.** Supabase and `next/navigation` are mocked
  globally in `jest.setup.ts`. For a client that behaves differently (a
  rejecting session, a realtime channel, seeded rows), import
  `createSupabaseClientMock` from `__tests__/setup/mocks.ts` rather than
  hand-rolling one. `installFetchMock` there routes `fetch` by URL and method.
- **Testing an API route handler?** Add `@jest-environment node` at the top of
  the file — route handlers have no `window`.
- **Assert on behavior, not markup.** Prefer roles and visible text
  (`getByRole("button", { name: /save/i })`) over class names.
- **Test the failure paths.** Most of the bugs that reach users are in the
  `catch` block: the error toast that never fires, the delete that reports
  success after a 500.
- When you deliberately pin existing behavior you believe is wrong, say so in a
  comment naming it a known bug, so the next person does not take it as intent.

## Code conventions

- TypeScript for all new and modified files.
- Avoid `any`. It is reported as an ESLint warning and the count should go down,
  not up. Prefer a described interface — see `lib/admin/agent-types.ts` for the
  pattern of typing an API payload as received, with nullable joins.
- Prefer Server Components; add `"use client"` only where interactivity needs it.
- Backend calls go through the wrappers: `serverApiGet` / `serverApiPost` in
  server code (`lib/api-server.ts`), `clientApiGet` / `clientApiPatch` in client
  code (`lib/api-client.ts`).
- Validate untrusted input with Zod schemas in `lib/schemas/`.

## File size and the max-lines ratchet

ESLint enforces **`max-lines: 500`** as an error. Existing offenders are listed
in an explicit allowlist in `.eslintrc.json`.

**That list may only ever shrink.** Do not add entries to it. If your change
pushes a file over the limit, split the file — extracting a hook, a sub-component
or a config module is almost always possible. When you split a file that is on
the list, delete its entry in the same commit.

`components/admin/dashboard/` is the reference example: a 1156-line component
became a 168-line shell plus a shared nav config that two views render from.

Note that `max-lines` counts non-blank, non-comment lines *after* Prettier has
formatted the file. A file that only passes because it packs logic into
200-character lines is not actually under the limit — formatting will reveal it.

Extracting a data layer into a hook (`hooks/use-vendor-orders.ts`,
`hooks/use-agent-management.ts`) is usually the best first cut: it shrinks the
component and makes the fetching testable in one move.

## Logging and error handling

Use the structured logger in `lib/logger.ts`, not `console`:

```ts
import { logger, normalizeError } from "@/lib/logger"

const log = logger.child("admin.agent-management")

log.info("agents loaded", { count: agents.length })
log.error("failed to toggle status", error, { agentId })
```

- Scope every module with `logger.child(...)` so lines carry their origin.
- `catch (error)` — not `catch (error: any)`. Use `normalizeError(error).message`
  to get a message safely; it handles `Error`, strings and Supabase-style
  `{ message, code }` objects.
- `setErrorReporter` is the single place to wire an error-tracking service; do
  not scatter integrations through components.
- User-visible failures need a toast *and* a log. A silent `catch` is a bug.

## Dependencies

- Add with `npm install <package>`; commit the `package-lock.json` change.
- Dependabot opens weekly update PRs (`.github/dependabot.yml`). Next and React
  majors are excluded from that cadence — they are coordinated upgrades.
- Run all the checks after any dependency change.

## Security

- Never commit `.env.local` or real credentials. `.env.example` documents every
  variable the code reads; add yours there when you introduce one.
- Secrets must not have in-code fallbacks. A missing secret should disable the
  feature, not silently fall back to a value that is public in the repo — see
  `app/api/setup/create-admin/route.ts`.
- Compare secrets in constant time (`crypto.timingSafeEqual`), hashing both
  sides first so lengths cannot leak.
- Report vulnerabilities privately to the maintainers, not in a public issue.
