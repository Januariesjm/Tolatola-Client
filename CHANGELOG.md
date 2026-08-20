# Changelog

All notable changes to the Tolatola client are recorded here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
this project aims to follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Order schemas** (`lib/schemas/order.ts`) — zod, so the same definitions type
  the order detail page *and* validate the confirm-delivery request body. This
  is the first API boundary in the repo with runtime input validation.
- **`lib/orders/status-colors.ts`**, `lib/checkout/delivery-grouping.ts`,
  `hooks/use-blog-editor.ts` — pure/extracted logic lifted out of god files.
- **`jest.coverage-threshold.js`** plus a test that asserts the floor exists and
  is non-zero, so deleting coverage enforcement now fails the suite instead of
  passing quietly.
- **139 more tests** (328 → 467).

### Changed

- **`blog-management-tab.tsx` 1022 → 766** and **`checkout-content.tsx`
  1039 → 1000** lines.
- **`order-detail-content.tsx`** no longer takes `order: any`.
- **213 + 20 `console.error`/`console.warn` calls** across app/, components/,
  hooks/ and lib/ now go through the scoped logger. Zero remain outside
  `lib/logger.ts` and the deliberate console wrapper in
  `components/utils/global-error-logger.tsx`.
- **Coverage floor** raised to 14 / 10 / 7 / 14 (from 13 / 8 / 7 / 13).

### Fixed

- **Confirm-delivery failures were invisible.** `handleConfirmDelivery` only
  refreshed on `response.ok` and ignored every other outcome, so a 409 or 500
  looked exactly like success — on the action that finalises payments and closes
  escrow. It now logs and shows a retryable error.
- **A null order status crashed the order page.** `getStatusColor` called
  `.toLowerCase()` on the raw value; both mappers now fall back to a grey badge.
- **Unguarded reads on the order page**: `order.order_items[0].products.shops.*`
  and several `order.shipping_address.*` accesses would throw for an order with
  no items, while the same fields were optional-chained elsewhere in the file.
- **Unvalidated API input**: `POST /api/orders/confirm-delivery` destructured
  `orderId` straight out of `request.json()`. A missing or non-string id reached
  the Supabase query and surfaced as a confusing 404; it is now a 400 that says
  why, and a non-JSON body no longer causes an unhandled rejection.
- **Duplicated delivery weight arithmetic.** checkout-content.tsx derived
  per-shop weights in two places — the address handler and the transport-method
  effect. Both now come from `shopWeights`.

### Known issues

- The Next 14 → 16 upgrade is still outstanding, so the 5 high-severity
  advisories remain and the CI audit job still gates on critical only.
- Statement coverage is 14.5%. The `lib/` modules are at or near 100%; the gap
  is the remaining large UI components.
- 21 files remain in the `max-lines` allowlist.
- 77 `console.log` calls remain (deliberate traces, not error paths).


## [1.1.0] - 2026-08-21

Second engineering-quality pass, on top of the CI/observability work below.

### Added

- **Prettier, enforced.** `.prettierrc.json`, `npm run format` /
  `npm run format:check`, and a `format` job in CI. 297 files formatted.
  `printWidth` is 140, chosen by measurement rather than taste: this codebase
  has many 150-200 character Tailwind `className` lines, and at 120 the reformat
  pushed 8 files past the `max-lines` rule versus 3 at 140.
- **Dependency audit in CI.** An `audit` job that hard-fails on critical
  advisories and reports high ones non-blocking.
- **Shared modules** extracted from god files: `hooks/use-agent-management.ts`,
  `hooks/use-vendor-orders.ts`, `hooks/use-site-header-state.ts`,
  `lib/admin/validation-surveys-export.ts`, `lib/validation-survey-options.ts`,
  `lib/validation-survey-form.ts`, `lib/types/product.ts`, and the
  `components/admin/agents/`, `components/validation/` component groups.
- **A user-visible fallback** when product recommendations fail to load.
- **aria-labels** on the product page's icon-only quantity, colour and size
  buttons, which previously had no accessible name at all.
- **79 more tests** (276 -> 355), covering the product detail page, the survey
  exporters, the extracted survey validators and the vendor orders hook.

### Changed

- **Four god files split**, none of them added to the `max-lines` allowlist:
  `agent-management-tab.tsx` 950 -> 499, `validation-surveys-tab.tsx` 952 ->
  ~400, `site-header.tsx` 509 -> 445, `vendor-orders-tab.tsx` 526 -> 449, plus
  `app/validation/page.tsx`. The allowlist now has 21 entries, down from 23.
- **`.eslintrc.json` is now strict JSON.** ESLint accepts JSON-with-comments but
  `JSON.parse` does not, which is the likely reason external tooling reported no
  `max-lines` rule while one was being enforced.
- **`product-detail-content.tsx` is fully typed** — `product: any`,
  `reviews: any[]` and three `useState<any>` replaced with `lib/types/product.ts`.
- **51 + 2 `console.error` calls** replaced with the scoped logger; the last two
  were outside `components/admin/` and missed by the first sweep.
- **Coverage floor raised** to 13% statements / 8% branches.
- **`typescript.ignoreBuildErrors` removed** from `next.config.mjs`.

### Fixed

- **Removed 8 unused runtime dependencies** (`@vercel/blob`,
  `@vercel/analytics`, `@supabase/ssr`, `@hookform/resolvers`, `google-maps`,
  `tailwindcss-animate`, `geist`, `server-only`); 58 -> 50 direct deps.
  `@vercel/blob` mattered beyond tidiness: it was the only path to the undici
  advisories (request smuggling, unbounded decompression). Advisories: 10 -> 5,
  and none of the remaining are critical.
- **`npm test` on Node >= 22.6.** Jest could not load `jest.config.ts`; it is now
  `jest.config.js` (CommonJS). Verified on Node 20.9, 20.20 and 23.7.
- **Duplicated region list.** The 31 Tanzanian regions were declared twice —
  once in the public survey form, once in the admin tab. A region added to one
  and not the other silently dropped rows from the admin filter.
- **`src={undefined}` on the product page** when `selectedImageIndex` pointed
  past the end of `product.images`.
- **Two silent failures**: the empty `catch {}` around the recommendations fetch,
  and the header profile load's bare `console.error`.

### Known issues

- The `lib/clickpesa.ts` provider-name bug below is still open.
- Statement coverage is 13.3%. The denominator is all of `lib/` and
  `components/`; the tested modules are at or near 100%.
- 21 files remain in the `max-lines` allowlist.
- 683 ESLint warnings remain (mostly `no-explicit-any`, `no-img-element` and
  `react-hooks/exhaustive-deps`). Warnings do not fail the build.

## [1.0.1] - 2026-08-20

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
- **Coverage floor** (`coverageThreshold` in `jest.config.js`), enforced by
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

- **`npm test` failed on Node >= 22.6.** Jest could not load `jest.config.ts`:
  that Node strips TS types natively, so Jest imports a `.ts` config through
  native ESM rather than ts-node, and the extensionless `next/jest` specifier is
  not resolvable under ESM. It only worked on Node 20 because ts-node loaded the
  file as CommonJS. The config is now `jest.config.js` (CommonJS, typed via
  JSDoc), which loads identically on every Node version. Verified on Node 20.9,
  20.20 and 23.7.
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
