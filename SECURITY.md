# Security Policy

This is the security policy for the Tolatola client (the Next.js marketplace
frontend). It covers how to report a vulnerability, what is in scope, and what
this project already knows about.

Three documents divide the work between them:

| Document                                                | Answers                                                |
| ------------------------------------------------------- | ------------------------------------------------------ |
| This file                                               | How do I report something, and what happens next?      |
| [SECURITY_DEBT.md](./SECURITY_DEBT.md)                  | What risk is already known and deliberately accepted?  |
| [CONTRIBUTING.md](./CONTRIBUTING.md#security)            | What rules must my code follow?                         |

## Reporting a vulnerability

**Do not open a public issue or pull request for a security problem.** A public
report tells everyone, including whoever would exploit it, before there is a
fix.

Report it privately instead, by either route:

1. **GitHub private vulnerability reporting** — the "Report a vulnerability"
   button under this repository's **Security** tab. This is preferred: it opens a
   private thread with the maintainers, attached to the repository, with no
   address to look up.
2. **Directly to the maintainers** — if private reporting is not enabled for your
   account, contact a maintainer listed in the repository's settings and ask for
   a private channel before sending any details.

A report is most useful with:

- what an attacker can do, in one sentence;
- the affected route, component or file;
- the steps or request that reproduce it, including the account role needed
  (anonymous, buyer, vendor, transporter, agent, admin);
- the impact you believe it has — data disclosure, privilege escalation, money
  movement, denial of service.

Please do not run automated scanners against a deployed environment, and do not
access, modify or exfiltrate data belonging to anyone else while testing. If you
reach real user data by accident, stop and say so in the report.

### What to expect

This is a small team, so these are intentions rather than a contractual SLA:

| Stage                                             | Target        |
| ------------------------------------------------- | ------------- |
| Acknowledgement that the report was received      | 3 working days |
| An initial assessment (in scope? severity?)       | 10 working days |
| Fix or a documented mitigation for a critical/high | 30 days       |

We will tell you what we decided and why, including if we conclude the report is
not a vulnerability. If you would like credit in the release notes, say so and
we will include it; otherwise reports stay anonymous.

## Supported versions

Only the `main` branch is supported. This is a deployed application, not a
distributed library — there is no backport branch, and fixes ship forward.

| Version         | Supported |
| --------------- | --------- |
| `main`          | Yes       |
| Tagged releases | No — fixes land on `main` and ship from there |

## Scope

**In scope**, in this repository:

- The route handlers under `app/api/**` — authentication, authorization, and the
  validation of request bodies and uploads.
- Anything that can read or write another user's data, or move money
  (`lib/agent/wallet.ts`, the subscription and checkout flows, the ClickPesa
  integration).
- Secret handling: a credential reaching the client bundle, a logged token, a
  secret with an in-code fallback.
- Client-side injection reachable through data the app renders (stored XSS
  through product, blog or profile content).
- Storage-path handling for uploads, where a path segment decides which user's
  folder is written to.

**Out of scope** here:

- The backend API (`NEXT_PUBLIC_API_BASE_URL`) and the Supabase project itself,
  including Row Level Security policies. Report those against the backend, and
  say so in the report if a client-side finding depends on one.
- Findings that require a compromised device, a malicious browser extension, or
  physical access.
- Missing hardening headers or a rate limit with no demonstrated impact — useful,
  but send them as a normal issue.
- The advisories already recorded in [SECURITY_DEBT.md](./SECURITY_DEBT.md). They
  are known; a report that adds a working exploit path for one of them is
  welcome, a report that re-lists them is not.

## What this project already does

So a report can skip what is covered:

- **CI hard-gates on critical advisories** (`npm audit --audit-level=critical`)
  and reports high ones. The 5 outstanding high advisories all trace to the
  `next` 14.x line, which has no patched release — see `SECURITY_DEBT.md` and
  `docs/NEXT_16_UPGRADE_PLAN.md`.
- **Every mutating API route validates its body** through
  `lib/api/validate-request.ts` (JSON) or `lib/api/validate-upload.ts`
  (multipart). Validation errors report the offending field's path and never echo
  the submitted value back.
- **Every upload route requires a session** and enforces one shared size and MIME
  allowlist, and reduces client-supplied filenames and path segments to safe
  values before they reach a storage key.
- **Secrets have no in-code fallbacks.** A missing secret disables the feature.
  Secret comparisons are constant-time over hashes of both sides.
- **The build requires no real credentials.** If the CI build job ever needs a
  secret, that is a regression.
