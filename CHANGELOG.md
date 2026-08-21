# Changelog

All notable changes to the Tolatola client are recorded here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
this project aims to follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **The withdrawal request is now validated by a zod schema**
  (`lib/validation/withdrawal.ts`), matching every other input boundary in the
  codebase instead of being the one hand-rolled `if` chain. `validateWithdrawal`
  in `lib/agent/wallet.ts` now parses through it and translates the result into
  the same Swahili-titled rejections it always returned -- the priority order
  (amount, then balance, then phone) and every existing test are unchanged, only
  now backed by a schema. There is no server route in this repo to wire it into:
  `agents/withdrawals/request` is served by the separate backend behind
  `NEXT_PUBLIC_API_BASE_URL`, so this is the client-side gate.
- **Tests for four previously untested modules**: `lib/services/order.service.ts`
  (order placement and transporter auto-assignment -- subtotal arithmetic, stock
  decrement, and the subscription-tier-then-rating ranking rule), the two
  functions in `lib/admin/initialization.ts`, the withdrawal schema itself, and
  `lib/i18n/language-context.tsx` (the provider every page in the app renders
  under, previously with no coverage at all). 98 tests.
- **CI now publishes the non-blocking high-advisory audit as a workflow
  summary** (`.github/workflows/ci.yml`), not only into the job log, with a link
  to `SECURITY_DEBT.md` and the Next 16 upgrade plan. The gate itself is
  unchanged: still hard-fails on critical, still reports high without blocking.

### Changed

- **`order-detail-content.tsx` split**: three status banners into
  `components/orders/order-status-banners.tsx`, the read-only sidebar into
  `components/orders/order-detail-sidebar.tsx`, and the confirm-delivery request
  into `hooks/use-confirm-delivery.ts`. 676 -> 419 lines, off the max-lines
  allowlist. Verified DOM-identical across 15 order states before landing.
- **`vendor-management-tab.tsx` split**: the vendor shape and search rules into
  `lib/admin/vendors.ts`, loading/toggling/deleting into
  `hooks/use-admin-vendors.ts`, and the details dialog into
  `components/admin/vendor-details-dialog.tsx`. 631 -> 345 lines, off the
  max-lines allowlist. The filtered list is now derived from a search query
  instead of a second piece of state kept in sync by an effect and by hand in
  three mutation handlers. Verified DOM-identical, including with the dialog
  open, before landing.

- **The last `any`-typed props and API envelopes in the dashboard tabs are
  typed.** `AdminProduct` (in `lib/types/admin.ts`) describes the admin product
  table's rows, and a new `lib/types/subscription.ts` describes the plan,
  current-subscription and checkout shapes the vendor and transporter
  subscription tabs share -- they consume the same endpoints, so they now share
  one type instead of eight `any`s between them. Three `catch (err: any)` blocks
  became `normalizeError`. Behaviour is unchanged; the types were derived from
  the fields the components actually read.

- **Agent wallet arithmetic extracted to `lib/agent/wallet.ts`.** The balances an
  agent sees, the 10% withdrawal fee, the net payout and the withdrawal
  validation rules all lived inside a 679-line component with no tests. They are
  now pure, typed functions with 48 unit tests, and
  `components/agent/agent-commission-tab.tsx` (679 → 633 lines) has no `any`
  left. Behaviour is unchanged.

### Added

- **`SECURITY.md`** — a reporting policy: how to report privately (GitHub private
  vulnerability reporting), what is in and out of scope for this repository as
  opposed to the backend and Supabase, acknowledgement and fix targets, and what
  the project already enforces so a report can skip it. It points at
  `SECURITY_DEBT.md` for accepted risk and `CONTRIBUTING.md` for the rules code
  must follow, rather than duplicating either.
- `__tests__/lib/agent/wallet.test.ts` and
  `__tests__/components/agent/agent-commission-tab.test.tsx` — 61 tests covering
  the wallet load (including keeping server-rendered balances when the request
  fails), every withdrawal rejection branch, the fee preview, and a successful
  withdrawal's request body.

### Notes

Two constraints the component relies on, now pinned by tests rather than
implicit: the withdraw trigger is disabled until a withdrawable balance loads,
and the phone field is `required`, so native form validation blocks submission
before the insufficient-balance check can run.

## [v1.2.0] — 2026-08-22

Security hardening of the upload boundary, plus the god-file and `any` debt in
the largest remaining components. No user-facing feature changes.

### Fixed

- **Three file-upload routes had no authentication.** `POST /api/upload` wrote
  straight into the public `promotions` bucket, and
  `/api/upload-product-image` and `/api/upload-transporter-document` proxied
  uploads to the backend, for anyone who could reach them. All three now
  require a session.
- **No upload had a consistent size or type limit.** Only
  `upload-business-license` enforced one. Without it, an attacker could upload
  HTML or SVG that is then served from a public URL, or exhaust storage with a
  single large file. `lib/api/validate-upload.ts` now applies the same limits
  (5MB; PDF/JPEG/PNG) to every upload route, answering 413 for oversized and
  415 for a disallowed type.
- **Path traversal in KYC uploads.** `/api/kyc/upload-document` built a storage
  key from two client-controlled values (`documentType` and `file.name`). That
  bucket's RLS policy relies on the first path segment being the caller's uid,
  so a value containing `../` escaped the caller's own folder. Both are now
  reduced to safe segments.
- **`fetchNotifications` could return a non-array.** It declared
  `AppNotification[]` but passed the raw payload through when truthy, so a `{}`
  response came back as an object — and every caller maps over the result.
- **Money rendered unformatted** on the agent commission tab: `formatTzs` took
  `number` while the API returns numeric strings, so `TZS 25000` appeared
  instead of `TZS 25,000`.
- **`useState` used as a side effect** in the product detail page, setting state
  during render; and a corrupt `localStorage` cart crashed that page outright.

### Changed

- **Six god files split**, each verified DOM-identical against the original
  before landing:
  `sign-up/page.tsx` 845 → 16, `blog-management-tab.tsx` 766 → 52,
  `product-detail-content.tsx` 857 → 89, `hr-payroll-subtab.tsx` 804 → 35,
  and the near-duplicate `add-product-dialog.tsx` / `edit-product-dialog.tsx`
  (939 + 929) → shared form + two ~35-line shells. Files over 500 LOC: 22 → 18;
  the `max-lines` allowlist: 21 → 15.
- **`any` removed** from the support widget, the agent commission tab, the
  product detail page, the HR payroll subtab and the whole service layer, backed
  by new types in `lib/types/agent.ts`, `lib/support/chat-message.ts` and
  `lib/vendor/product-form.ts`.
- **Validated API boundaries: 19 → 25 of 26 mutating routes.** The remaining one
  takes no body.
- **Coverage floor 14% → 25%**, tracking real coverage; `lib/services` went from
  0% to 74%.

### Added

- `SECURITY_DEBT.md` recording accepted risk and what closing each item
  requires, including the ClickPesa webhook's missing signature verification.
- `lib/auth/country-codes.ts`, extracting a 122-entry dialling-code table that
  had been inlined in the sign-up page, with the longest-prefix-first invariant
  now tested.
- Shared validators `lib/api/validate-request.ts` and
  `lib/api/validate-upload.ts`.
- Tests: 1173 → 1317.

### Known issues

- The 5 high-severity advisories from the Next 14 line remain; see
  `SECURITY_DEBT.md`. CI gates on critical and reports high.
- `PaymentService.handleWebhook` records a PENDING callback as
  `payment_status: "failed"`; pinned by a test pending a product decision.
- `lib/clickpesa.ts` sends `MIXX_BY-YAS` instead of `MIXX_BY_YAS`; needs
  confirmation of the value ClickPesa expects.

### Earlier in this cycle

The same release, work that landed before the upload-security pass.
#### Added

- **Order schemas** (`lib/schemas/order.ts`) — zod, so the same definitions type
  the order detail page *and* validate the confirm-delivery request body. This
  is the first API boundary in the repo with runtime input validation.
- **`lib/orders/status-colors.ts`**, `lib/checkout/delivery-grouping.ts`,
  `hooks/use-blog-editor.ts` — pure/extracted logic lifted out of god files.
- **`jest.coverage-threshold.js`** plus a test that asserts the floor exists and
  is non-zero, so deleting coverage enforcement now fails the suite instead of
  passing quietly.
- **139 more tests** (328 → 467).

#### Changed

- **`blog-management-tab.tsx` 1022 → 766** and **`checkout-content.tsx`
  1039 → 1000** lines.
- **`order-detail-content.tsx`** no longer takes `order: any`.
- **213 + 20 `console.error`/`console.warn` calls** across app/, components/,
  hooks/ and lib/ now go through the scoped logger. Zero remain outside
  `lib/logger.ts` and the deliberate console wrapper in
  `components/utils/global-error-logger.tsx`.
- **Coverage floor** raised to 14 / 10 / 7 / 14 (from 13 / 8 / 7 / 13).

#### Fixed

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

#### Known issues

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
