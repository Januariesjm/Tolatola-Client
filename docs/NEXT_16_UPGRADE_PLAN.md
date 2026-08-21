# Next.js 16 upgrade plan

**Status:** not started. This is the one outstanding blocker on the dependency
audit, and it is deliberately not bundled with unrelated work.

## Why this is necessary

`npm audit` reports 5 high-severity advisories. All five resolve to one root
cause:

| Package                    | Vulnerable range                   | Fix available    |
| -------------------------- | ---------------------------------- | ---------------- |
| `next`                     | `9.3.4-canary.0 - 16.3.0-preview.10` | `next@16.3.1`  |
| `postcss`                  | `<=8.5.22` (via `next`)            | `next@16.3.1`    |
| `eslint-config-next`       | `14.0.5-canary.0 - 15.0.0-rc.1`    | `eslint-config-next@16.3.1` |
| `@next/eslint-plugin-next` | `14.0.5-canary.0 - 15.0.0-rc.1`    | `eslint-config-next@16.3.1` |
| `glob`                     | `10.2.0 - 10.4.5`                  | `eslint-config-next@16.3.1` |

The important line is the `next` range. It covers **every** published 14.x and
15.x release. There is no patched version inside the 14 line, so this cannot be
resolved by a patch bump, a minor bump, or an override — the only fix `npm audit`
offers is `next@16.3.1`, flagged `isSemVerMajor: true`.

Consequently:

- Raising the CI gate to `--audit-level=high` **before** this upgrade lands would
  leave CI permanently red, which is worse than reporting the findings. The
  `audit` job therefore gates on `critical` and reports `high` non-blocking. That
  is a deliberate, documented decision, not an oversight — see
  `.github/workflows/ci.yml`.
- Suppressing the advisories or lowering the level was rejected: it would hide a
  real exposure.

## What the advisories actually expose

Worth reading before prioritising. The bulk are denial-of-service and
cache-poisoning issues in Next's own request handling, plus two XSS issues:

- **Cache poisoning / confusion** (GHSA-3g8h-86w9-wvmq, GHSA-vfv6-92ff-j949,
  GHSA-wfc6-r584-vfw7, GHSA-68g3-v927-f742, GHSA-4633-3j49-mh5q) — the most
  serious class here, because a poisoned response can be served to other users.
- **SSRF** (GHSA-c4j6-fc7j-m34r, GHSA-89xv-2m56-2m9x, GHSA-p9j2-gv94-2wf4) —
  relevant given this app proxies to a backend API and to ClickPesa.
- **XSS** (GHSA-ffhc-5mcf-pf4q with CSP nonces, GHSA-gx5p-jg67-6x7h in
  `beforeInteractive` scripts) — this app uses the App Router but does not
  currently set CSP nonces or `beforeInteractive` scripts, so these two are not
  reachable today.
- **DoS** in the image optimizer, Server Components and Server Actions — the app
  is self-hosted behind its own ingress, so rate limiting there mitigates
  somewhat but does not fix.
- **Middleware / proxy bypass** (GHSA-36qx-fr4f-26g5) — Pages Router + i18n only.
  This app is App Router with no i18n routing, so not reachable.

## Blast radius

This is a two-major-version jump (14 → 15 → 16), and it drags React with it.

| Concern | Current | Required |
| --- | --- | --- |
| `next` | 14.2.35 | 16.3.1 |
| `react` / `react-dom` | 18.3.1 | 19.x |
| `eslint-config-next` | 14.2.35 | 16.3.1 |

Specific things that will need work:

1. **React 19.** Next 16 requires it. That means checking every `@types/react`
   and `@types/react-dom` usage, and the ~40 `@radix-ui/*` packages — the pinned
   1.x Radix versions in `package.json` predate React 19 and several will need
   bumping. `recharts@2.15.4`, `vaul@0.9.9`, `react-day-picker@9.8.0`,
   `embla-carousel-react@8.5.1` and `input-otp@1.4.1` all need compatibility
   checks too.
2. **Async request APIs.** Next 15 made `cookies()`, `headers()`, `params` and
   `searchParams` async. This repo has 35 route handlers under `app/api` plus
   `middleware.ts`, and `app/api/orders/[id]/assign/route.ts` already destructures
   `params` synchronously. Every one needs auditing.
3. **`@supabase/auth-helpers-nextjs`.** Already deprecated in favour of
   `@supabase/ssr`, and its cookie handling is exactly what the async-request-API
   change breaks. Expect to migrate this at the same time; it is used by
   `lib/supabase/client.ts`, `lib/supabase/server.ts` and `middleware.ts`.
4. **Caching defaults.** Next 15 flipped `fetch` and route handlers to
   uncached-by-default. Anything relying on the old implicit caching will change
   behaviour — quietly, and in the direction of more load on the backend.
5. **Tailwind 4 / PostCSS.** The `postcss` advisory is transitive through `next`,
   but this repo also has `@tailwindcss/postcss@4` and `tailwindcss@4` pinned
   directly; verify the pipeline still builds.

## Suggested sequencing

Do not attempt this in one commit.

1. **Branch, don't trunk.** Land it on a branch and read the true blast radius
   from `npm run typecheck` and `npm run build` before committing to a plan.
2. **React 19 first, on Next 14.** Next 14.2 tolerates React 19 in most cases.
   Getting Radix and the chart/carousel libraries green against React 19 while
   the framework is still familiar isolates one variable.
3. **Next 14 → 15.** Apply the async request APIs codemod
   (`npx @next/codemod@canary upgrade latest`), then hand-audit every route
   handler and `middleware.ts`. Migrate off `auth-helpers-nextjs` to
   `@supabase/ssr` in this step.
4. **Next 15 → 16.** Should be the smaller half once step 3 is done.
5. **Flip the CI gate.** Change the `audit` job to gate on `high` and delete the
   non-blocking reporting step. Update `jest.coverage-threshold.js` only if the
   upgrade changes coverage.

## Definition of done

- `npm audit --audit-level=high` exits 0.
- `.github/workflows/ci.yml` gates on `high` with no `continue-on-error`.
- `npm run lint`, `format:check`, `typecheck`, `test -- --ci` and `build` all
  pass.
- Manual smoke test of the flows the caching and async-params changes touch most:
  checkout (order creation + payment initiation), the ClickPesa webhook, admin
  role assignment, and the support widget's realtime subscription.
