# Changelog

All notable changes to the Tolatola client are recorded here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
this project aims to follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Engineering-quality pass: CI enforcement, observability, and a start on the
god-file and `any` debt. No user-facing feature changes.

### Added

- **CI that actually gates.** `.github/workflows/ci.yml` runs lint, typecheck,
  test and build on every pull request. A `quality` job was added to
  `deploy-client.yml` that the deploy now `needs`, so nothing reaches Cloud Run
  unless lint, typecheck and the test suite pass on the deployed commit.
- **Enforced ESLint config** (`.eslintrc.json`) extending `next/core-web-vitals`.
  `npm run lint` previously had no config at all and dropped into `next lint`'s
  interactive setup prompt, so it could never run unattended.
- **`max-lines` (500) enforced as an error**, with a documented shrink-only
  allowlist for existing offenders, so no new god file can land.
- **Coverage floor** (`coverageThreshold` in `jest.config.ts`), enforced by
  `npm test` and therefore by CI and the deploy gate.
- **Structured logger** (`lib/logger.ts`): level-tagged, scoped output with
  structured context, error normalization for `Error`/string/Supabase-shaped
  values, and `setErrorReporter` as the single wiring point for an
  error-tracking service.
- **React error boundaries**: `app/error.tsx` (route level) and
  `app/global-error.tsx` (root layout), both reporting through the logger. The
  app previously had none, so a render-time throw showed a blank page.
- **One-command Docker startup**: `docker-compose.yml` plus a dependency-free
  stub backend (`docker/api-stub/server.js`). `docker compose up --build` runs
  the app with no real backend, Supabase project or third-party account.
- **Dependabot** (`.github/dependabot.yml`) for npm, GitHub Actions and Docker,
  with Radix and the test toolchain grouped.
- **Shared test fixtures** (`__tests__/setup/mocks.ts`): a configurable Supabase
  double and a URL/method-routed fetch mock, used by `jest.setup.ts` so no suite
  can reach a live project.
- **`CONTRIBUTING.md`** and this changelog.
- **`hooks/use-ticket-message-counts.ts`**, extracted from
  `support-tickets-tab.tsx`.
- **186 new tests** (77 → 276): the admin-setup route, the logger, both error
  boundaries, the agent-management handlers, the dashboard nav config,
  `lib/tokenSigner`, `lib/clickpesa`, `lib/admin/roles`, `lib/admin/middleware`,
  `lib/notifications` and the new hook. Statement coverage 7.81% → 11.42%.

### Changed

- **`components/admin/admin-dashboard-content.tsx` split** from 1156 lines into
  a 168-line shell plus `components/admin/dashboard/`. The desktop sidebar and
  the mobile tab strip were two hand-maintained lists of the same ~26 entries,
  each repeating its own permission check; both now render from a single
  `nav-items.ts` config. Verified byte-identical DOM against the previous
  component across five permission profiles.
- **npm is the only supported package manager.** `yarn.lock` is deleted. This
  was not cosmetic: the Dockerfile's package-manager detection tried `yarn.lock`
  first, so production images installed from a lockfile that had already drifted
  from `package-lock.json` (it predated the test toolchain). The Dockerfile now
  runs a plain `npm ci`.
- **`typescript.ignoreBuildErrors` removed** from `next.config.mjs`. It was
  masking nothing — the build passes with type checking on — so type errors now
  fail the build instead of shipping.
- **51 `console.error` calls across 26 admin components** replaced with the
  scoped logger. `[v0]` and `[BLOG ADMIN]`-style string prefixes became scopes.
- **`agent-management-tab.tsx` typed**: `useState<any[]>` for agents,
  commissions and rates, `useState<any>` for stats, `initialAgents: any[]` and
  four `catch (err: any)` blocks replaced with types in
  `lib/admin/agent-types.ts` and `normalizeError`.
- **`.env.example` completed** with the three variables the code reads but never
  documented: `ADMIN_SETUP_KEY`, `GOOGLE_MAPS_API_KEY`, `STORAGE_BUCKET`. The
  stale root `env.example` (5 of 13 variables, referenced by nothing) is gone.
- **README** gains one-command Docker startup, a "Verifying a fresh clone"
  section, correct prerequisites, and the `## Scripts` heading its table of
  contents already linked to.
- `Dockerfile` accepts `NEXT_PUBLIC_API_URL` as a build arg, so a local stack
  can avoid the production API fallback baked into the support widget.

### Fixed

- **Security: `ADMIN_SETUP_KEY` no longer has a hardcoded fallback.**
  `app/api/setup/create-admin` fell back to a literal key that is public in this
  repository, so any deployment that had not set the variable would hand the
  first admin account to anyone who sent the request. The route now returns 503
  when the variable is unset, compares the key in constant time, and rejects a
  non-string `setupKey`.
- `jest.setup.ts` guards its `window` access, so suites can opt into
  `@jest-environment node` to test route handlers.
- `useTicketMessageCounts` keys its effect on conversation ids rather than the
  tickets array identity, so a re-render with the same conversations no longer
  re-subscribes to realtime.
- Admin dashboard sign-out no longer leaves the user on an authenticated-looking
  page when `signOut` throws; it logs and redirects regardless.

### Known issues

- **`lib/clickpesa.ts` mis-maps one provider name.** The value is built with
  `.replace("-", "_")`, which replaces only the first hyphen, so `mixx-by-yas`
  is sent as `MIXX_BY-YAS` rather than `MIXX_BY_YAS`. Every other provider has a
  single hyphen and is unaffected. Left unchanged because the fix alters a
  payload sent to a live payment provider and needs someone who can confirm the
  expected value. A test pins the current behavior and marks it as a bug.
- **Statement coverage is 11.42%, short of the 30% checkpoint.** The denominator
  is all of `lib/` and `components/`, and roughly 8,400 of 9,611 statements are
  UI components — about 29 of them over 500 lines. The tested modules are at or
  near 100%. Closing the gap means broad component testing.
- **23 files remain over 500 lines**, listed in the `.eslintrc.json` allowlist.
  New files cannot exceed the limit; these are to be paid down as they are
  touched.
- 558 ESLint warnings remain, mostly `no-explicit-any`,
  `@next/next/no-img-element` and `react-hooks/exhaustive-deps`. Warnings do not
  fail the build; the `exhaustive-deps` ones are potential bugs and were left
  alone because changing effect dependencies can alter runtime behavior.

## [Tolatolav1.0.0]

Initial tagged release.
