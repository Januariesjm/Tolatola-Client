# Security debt

Known, accepted security debt with the reason it is still open and what closing
it requires. Anything that can be fixed without a breaking change should be
fixed rather than listed here.

Last reviewed: 2026-10-31.

## Open

### npm advisories: 1 critical and 9 high, rooted in Next 14 and zod 3

`npm audit` reports 47 advisories: 1 critical, 9 high, 36 moderate and 1
low. The critical finding is `next@14.2.35`:

| GHSA | Advisory | Patched in |
|---|---|---|
| `GHSA-p293-qw3h-jr36` | Unauthenticated RCE on Windows-hosted servers | 15.5.24 |
| `GHSA-2xp9-vwfh-vxw4` | Unauthenticated RCE in the Image Optimization API (AVIF) | 15.5.24 |
| `GHSA-2464-fhr4-w9xw` | Unauthenticated RCE in the Image Optimization API (SVG) | 15.5.28 |

`npm audit` recommends `next@16.4.3`; `15.5.28` is the latest 15.x security
backport and clears the critical range too. Both are major upgrades, and there
is **no patched 14.x release**, so this cannot be closed by a patch bump, a
minor bump or an override.

The high advisories fall into three groups:

| Package | Why it is high | Resolution |
|---|---|---|
| `next`, `postcss` | Same Next 14 root cause as the criticals; `postcss` is bundled inside `next` | Next 15.5.28+ / 16.4.3 (major) |
| `glob`, `eslint-config-next`, `@next/eslint-plugin-next` | Lint-time only; never run in production or handle user input | `eslint-config-next@16` (major) |
| `brace-expansion`, `browserslist`, `js-yaml`, `source-map-js` | Transitive dev/build tooling; non-breaking fixes are available | `npm audit fix` in a separate dependency-hygiene change |
| `zod` | Memory-exhaustion advisory in the 3.x line | `zod@4` (major) |

The `brace-expansion` / `browserslist` / `js-yaml` / `source-map-js` group can be
cleared by `npm audit fix`, but that currently rewrites hundreds of unrelated
lockfile entries (including a `glob` downgrade), so it belongs in its own
dependency-hygiene PR rather than this CI-gate fix.

**Exposure.** `next` and `postcss` are the production-relevant advisories. The
Windows-only RCE does not apply to this Linux/Cloud Run deployment, but the
Image Optimization RCEs do. The lint-time and dev-tooling advisories do not run
in the deployed app. `@sentry/nextjs` was bumped from 10.70.0 to 10.78.0, which
cleared its critical advisory.

**Why the framework upgrade is still open.** Next 14 → 16 is not a dependency
bump:

- Next 15 made `cookies()` and `headers()` async. `lib/supabase/server.ts` and
  every route handler and server component that reads a session calls them
  synchronously.
- `@supabase/auth-helpers-nextjs` — used by every Supabase client in this repo —
  is deprecated and unlikely to support Next 16. The upgrade probably has to
  become a move to `@supabase/ssr` at the same time.
- `zod@4` is its own breaking migration across the API schemas.

Attempting this as a single change across 433 files with a live Cloud Run deploy
is how you ship an outage.

**How CI handles it today.** `.github/workflows/ci.yml` runs
`scripts/check-critical-audit.mjs`, which **hard-fails on any critical advisory
except the three Next 14 GHSAs listed above**. The allowlist is deliberately
explicit: a new critical advisory in any package, including `next`, fails the
job until it is fixed or added here with a documented reason. High advisories
remain non-blocking and are published to the workflow summary; gating on `high`
today would leave CI permanently red, which trains people to ignore it.

**Plan to close.**

1. Branch `upgrade/next-16`. Bump `next`, `react`, `react-dom`,
   `eslint-config-next` together; regenerate the lockfile in the same commit.
2. Migrate `cookies()`/`headers()` call sites to async, one area per commit
   (Supabase clients, then route handlers, then server components), each with
   `npm run typecheck` and `npm test` passing.
3. Replace `@supabase/auth-helpers-nextjs` with `@supabase/ssr` if it has not
   shipped Next 16 support by then.
4. Migrate the API schemas to `zod@4`.
5. Verify `npm run build` and the Docker image build.
6. When `npm audit --audit-level=high` exits 0, remove the allowlist, delete
   `scripts/check-critical-audit.mjs` (or turn it into a plain high gate), and
   make the high-advisory step blocking.

Until step 6 lands, this file is the record — the advisories are known and
accepted, not overlooked.

### `POST /api/webhooks/clickpesa` has no signature verification

The ClickPesa webhook validates its body shape with
`clickpesaWebhookSchema` (`lib/schemas/api.ts`) but does not verify that the
request actually came from ClickPesa. Schema validation is not authentication:
anyone who can reach the endpoint and send a well-formed body can drive it.

Closing this needs the signing secret and header name from ClickPesa, then an
HMAC comparison over the raw body using `crypto.timingSafeEqual` — the same
pattern already used for `ADMIN_SETUP_KEY` in
`app/api/setup/create-admin/route.ts`. It must read the **raw** body, before
JSON parsing, or the computed digest will not match.

## Closed

- **Hardcoded `ADMIN_SETUP_KEY` fallback.** `app/api/setup/create-admin` fell
  back to a literal key committed in this repository, so any deployment that had
  not set the variable would hand the first admin account to whoever asked. The
  route now requires the variable, returns 503 when it is unset, and compares in
  constant time.
- **Unvalidated API request bodies.** Route handlers destructured straight out
  of `request.json()`. Bodies are now parsed with zod schemas via
  `lib/api/validate-request.ts`.
- **KYC record reassignment.** `POST /api/kyc/submit` spread the request body
  into a Supabase write; on the update path a body carrying someone else's
  `user_id` reassigned the caller's KYC record. The schema omits `user_id`, and
  zod strips unknown keys, so the column can only come from the session.
- **Unused `@vercel/blob` dependency** carrying the `undici` advisories
  (request smuggling, unbounded decompression). Removed rather than bumped.
