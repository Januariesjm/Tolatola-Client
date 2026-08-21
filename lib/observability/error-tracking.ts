/**
 * Error-tracking transport.
 *
 * `lib/logger.ts` already funnels every `error`-level record through a single
 * reporter hook; this is the thing that hook sends somewhere durable. Without
 * it, a production error exists only in the container's stdout for as long as
 * the log retention window lasts, and nothing groups or alerts on it.
 *
 * Deliberately not an SDK. It posts the same structured entry that is logged to
 * whatever collector `NEXT_PUBLIC_ERROR_TRACKING_DSN` names -- a Sentry tunnel
 * or relay, a Datadog HTTP intake, a Cloud Run sidecar, or a route of our own.
 * That keeps the dependency count and the client bundle unchanged, and swapping
 * in `@sentry/nextjs` later means replacing `send` and nothing else.
 *
 * Two properties matter more than features here:
 *
 *  - **It cannot break the caller.** Every failure path is swallowed. A
 *    telemetry outage must not turn into an application error.
 *  - **It cannot feed itself.** Reporting an error must never log an error that
 *    is then reported. The `sending` guard below is what prevents that loop, and
 *    it is the reason this module never calls `logger`.
 */

import { serializeEntry, setErrorReporter, toStructuredEntry, type LogRecord } from "@/lib/logger"

/** Most errors kept in flight before new ones are dropped. */
export const MAX_IN_FLIGHT = 8

/**
 * Window in which an identical error is treated as a duplicate and dropped.
 *
 * A render loop or a failing poller can log the same line hundreds of times a
 * second; without this, the transport becomes the outage.
 */
export const DEDUPE_WINDOW_MS = 10_000

export interface ErrorTrackingConfig {
  /** Collector endpoint. Absent disables the transport entirely. */
  dsn?: string
  /** Labels the entries, so staging noise is separable from production. */
  environment?: string
  /** Overridable for tests; defaults to the global `fetch`. */
  transport?: typeof fetch
}

export interface ErrorTrackingHandle {
  /** False when no DSN was configured, i.e. the feature is off. */
  enabled: boolean
  /** Removes the reporter. Returns the transport to the disabled state. */
  shutdown(): void
}

/** The payload posted to the collector. */
export interface ErrorTrackingPayload {
  environment: string
  /** One structured entry, in exactly the shape `lib/logger.ts` emits. */
  entry: ReturnType<typeof toStructuredEntry>
}

const DISABLED: ErrorTrackingHandle = { enabled: false, shutdown: () => {} }

/** Identity of an error for deduplication: same place, same failure. */
function dedupeKey(record: LogRecord): string {
  return `${record.scope ?? ""}|${record.message}|${record.error?.message ?? ""}`
}

/**
 * Registers the error-tracking reporter.
 *
 * Returns a disabled handle when no DSN is configured. That is the normal case
 * in development and in CI, and it is deliberate: a missing value disables the
 * feature rather than falling back to some default endpoint, matching how the
 * rest of this codebase treats absent configuration.
 *
 * Safe to call more than once -- the later call replaces the earlier reporter.
 */
export function initErrorTracking(config: ErrorTrackingConfig = {}): ErrorTrackingHandle {
  const dsn = config.dsn ?? process.env.NEXT_PUBLIC_ERROR_TRACKING_DSN
  if (!dsn) return DISABLED

  const environment = config.environment ?? process.env.NEXT_PUBLIC_APP_ENV ?? process.env.NODE_ENV ?? "development"
  const send = config.transport ?? (typeof fetch === "function" ? fetch : undefined)
  if (!send) return DISABLED

  const lastSeen = new Map<string, number>()
  let inFlight = 0
  // Guards against a report failing, that failure being logged, and the log
  // triggering another report. Nothing inside the reporter may log.
  let sending = false

  const reporter = (record: LogRecord) => {
    if (sending || inFlight >= MAX_IN_FLIGHT) return

    const now = Date.now()
    const key = dedupeKey(record)
    const previous = lastSeen.get(key)
    if (previous !== undefined && now - previous < DEDUPE_WINDOW_MS) return
    lastSeen.set(key, now)

    // Assembled from `serializeEntry`, which is guaranteed not to throw on an
    // awkward context, rather than stringifying the whole payload and risking it.
    const body = `{"environment":${JSON.stringify(environment)},"entry":${serializeEntry(toStructuredEntry(record, new Date(now)))}}`

    sending = true
    inFlight += 1
    try {
      // `keepalive` so a report started during a page unload still leaves.
      const result = send(dsn, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      })
      // A rejected promise here is a telemetry problem, not an app problem.
      Promise.resolve(result)
        .catch(() => {})
        .finally(() => {
          inFlight -= 1
        })
    } catch {
      // A synchronous throw from a patched or missing fetch.
      inFlight -= 1
    } finally {
      sending = false
    }
  }

  setErrorReporter(reporter)

  return {
    enabled: true,
    shutdown() {
      setErrorReporter(null)
      lastSeen.clear()
    },
  }
}
