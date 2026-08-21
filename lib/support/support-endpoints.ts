/**
 * Endpoint fallback lists for the support API.
 *
 * components/support/floating-support-widget.tsx built two of these by hand --
 * one for AI chat, one for ticket escalation -- each as a four-element array
 * literal repeating the same base-URL normalisation and the same hardcoded
 * production host. They are generated here instead, so the ordering and the
 * de-duplication are pinned by tests.
 *
 * The fallbacks exist because deployments disagree about whether support routes
 * are mounted under `/api`; the widget tries each in turn and keeps the first
 * that answers.
 */

/** Production host, used as the last resort when the configured base fails. */
export const SUPPORT_API_FALLBACK_HOST = "https://api.tolatola.co"

/** Trailing slashes would produce `//api/...` once a path is appended. */
function normalizeBase(base: string): string {
  return base.replace(/\/$/, "")
}

/** The configured API base, or the production host when unset. */
export function supportApiBase(): string {
  return normalizeBase(process.env.NEXT_PUBLIC_API_URL || SUPPORT_API_FALLBACK_HOST)
}

/**
 * Candidate URLs for a support path, most-preferred first: the configured base
 * with and without the `/api` prefix, then the production host the same way.
 *
 * Duplicates are removed, so when NEXT_PUBLIC_API_URL already points at the
 * production host the widget makes two attempts rather than four.
 *
 * @param path Support route without a leading slash, e.g. "ai-chat".
 */
export function buildSupportEndpoints(path: string): string[] {
  const base = supportApiBase()
  const suffix = path.replace(/^\//, "")

  const candidates = [
    `${base}/api/support/${suffix}`,
    `${base}/support/${suffix}`,
    `${SUPPORT_API_FALLBACK_HOST}/api/support/${suffix}`,
    `${SUPPORT_API_FALLBACK_HOST}/support/${suffix}`,
  ]

  return [...new Set(candidates)]
}
