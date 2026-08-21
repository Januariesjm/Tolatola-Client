import * as Sentry from "@sentry/nextjs"
import { normalizeError, setErrorReporter, type LogRecord } from "@/lib/logger"

/**
 * Sentry wiring for lib/logger.ts's error reporter.
 *
 * Deliberately additive, not a replacement for
 * lib/observability/error-tracking.ts: that module posts the same structured
 * entry the logger emits to any HTTP collector and needs no dependency or
 * account. This sends the same errors to Sentry specifically -- grouping,
 * alerting, stack traces resolved against source maps, and everything else a
 * dedicated error-tracking service does that a bare HTTP endpoint does not.
 *
 * A deployment can run either, both, or neither. Both are no-ops without their
 * own DSN, and `setErrorReporter`'s return value is how they compose: each
 * initializer chains to whichever reporter, if any, was registered first.
 */

export interface SentryReportingHandle {
  /** False when no DSN was configured, i.e. Sentry reporting is off. */
  enabled: boolean
  /** Un-chains Sentry, restoring whichever reporter (if any) came before it. */
  shutdown(): void
}

const DISABLED: SentryReportingHandle = { enabled: false, shutdown: () => {} }

/**
 * Initializes Sentry and chains it onto the logger's error reporter.
 *
 * Reads `NEXT_PUBLIC_SENTRY_DSN`. Absent means disabled -- there is no default
 * project to report into, matching how the rest of this codebase treats
 * missing configuration. Safe to call once per process; calling it again with
 * the same DSN just re-chains, which is harmless but pointless.
 */
export function initSentryReporting(): SentryReportingHandle {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
  if (!dsn) return DISABLED

  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV || "development",
    // This is error reporting, not performance monitoring -- no transactions.
    tracesSampleRate: 0,
  })

  const previousReporter = setErrorReporter((record: LogRecord) => {
    try {
      Sentry.withScope((scope) => {
        if (record.scope) scope.setTag("module", record.scope)
        if (record.context) scope.setContext("context", record.context)

        if (record.error) {
          const error = new Error(record.error.message)
          error.name = record.error.name
          if (record.error.stack) error.stack = record.error.stack
          Sentry.captureException(error)
        } else {
          Sentry.captureMessage(record.message, "error")
        }
      })
    } catch (err) {
      // A Sentry SDK failure must never take down the reporter chain.
      // eslint-disable-next-line no-console
      console.error("[sentry] failed to report error", normalizeError(err))
    }

    previousReporter?.(record)
  })

  return {
    enabled: true,
    shutdown() {
      setErrorReporter(previousReporter)
    },
  }
}
