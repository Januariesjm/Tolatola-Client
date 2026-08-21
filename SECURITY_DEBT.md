# Security debt

Known, accepted security debt with the reason it is still open and what closing
it requires. Anything that can be fixed without a breaking change should be
fixed rather than listed here.

Last reviewed: 2026-08-21.

## Open

### 5 high-severity npm advisories, all rooted in Next 14

`npm audit` reports five high advisories. Every one of them resolves only by
upgrading Next, and there is **no patched 14.x release** — `npm audit` names
`next@16.3.1` as the fix, a two-major jump.

| Package | Advisory summary | Fix per `npm audit` |
|---|---|---|
| `next` | DoS via Image Optimizer `remotePatterns`; DoS via RSC request deserialization; HTTP request smuggling in rewrites | `next@16.3.1` (major) |
| `postcss` | XSS via unescaped `</style>` in stringify output; arbitrary file read via attacker-controlled `sourceMappingURL` | via `next@16.3.1` (major) |
| `glob` | Command injection via the `-c/--cmd` CLI flag | via `eslint-config-next@16` (major) |
| `eslint-config-next` | Depends on the vulnerable `@next/eslint-plugin-next` | `eslint-config-next@16` (major) |
| `@next/eslint-plugin-next` | Depends on the vulnerable `glob` | via `eslint-config-next@16` (major) |

**Exposure.** `glob`, `eslint-config-next` and `@next/eslint-plugin-next` are
lint-time only — they never run in production or handle user input. The `next`
and `postcss` advisories are the ones that matter: the Image Optimizer and
rewrite paths are reachable in the deployed app.

**Why it is still open.** Next 14 → 16 is not a dependency bump:

- Next 15 made `cookies()` and `headers()` async. `lib/supabase/server.ts` and
  every route handler and server component that reads a session calls them
  synchronously.
- Next 15+ expects React 19, which is its own migration.
- `@supabase/auth-helpers-nextjs` — used by every Supabase client in this repo —
  is deprecated and unlikely to support Next 16. The upgrade probably has to
  become a move to `@supabase/ssr` at the same time.

Attempting this as a single change across 433 files with a live Cloud Run deploy
is how you ship an outage.

**How CI handles it today.** `.github/workflows/ci.yml` has an `audit` job that
**hard-fails on critical** advisories and **reports high ones without
blocking**. `npm audit --audit-level=critical` exits 0, so that gate is real
rather than decorative. Gating on `high` today would leave CI permanently red,
which trains people to ignore it.

**Plan to close.**

1. Branch `upgrade/next-16`. Bump `next`, `react`, `react-dom`,
   `eslint-config-next` together; regenerate the lockfile in the same commit.
2. Migrate `cookies()`/`headers()` call sites to async, one area per commit
   (Supabase clients, then route handlers, then server components), each with
   `npm run typecheck` and `npm test` passing.
3. Replace `@supabase/auth-helpers-nextjs` with `@supabase/ssr` if it has not
   shipped Next 16 support by then.
4. Verify `npm run build` and the Docker image build.
5. When `npm audit --audit-level=high` exits 0, remove `continue-on-error` from
   the "Report high advisories" step in `ci.yml` so it becomes a gate.

Until step 5 lands, this file is the record — the advisories are known and
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
