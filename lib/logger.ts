/**
 * Minimal structured logger.
 *
 * Replaces bare `console.log` / `console.error` calls so that log output has a
 * consistent shape (level, scope, message, context) and so there is exactly one
 * place to wire an error-tracking service into.
 *
 * Deliberately dependency-free and safe on both the server and the client.
 *
 *   import { logger } from "@/lib/logger"
 *
 *   const log = logger.child("agent-management")
 *   log.info("agents loaded", { count: agents.length })
 *   log.error("failed to toggle status", error, { agentId })
 */

export type LogLevel = "debug" | "info" | "warn" | "error"

/** Arbitrary structured metadata attached to a log line. */
export type LogContext = Record<string, unknown>

/** A thrown value reduced to a serializable shape. */
export interface NormalizedError {
  name: string
  message: string
  stack?: string
}

export interface LogRecord {
  level: LogLevel
  /** Dotted scope, e.g. "admin.agent-management". */
  scope?: string
  message: string
  context?: LogContext
  /** Normalized error, present for `warn`/`error` calls that were given one. */
  error?: NormalizedError
}

/**
 * Sink for `error`-level records, for wiring up Sentry/Datadog/etc.
 * A single reporter keeps the integration in one place instead of scattered
 * through components.
 */
export type ErrorReporter = (record: LogRecord) => void

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

function isLogLevel(value: string | undefined): value is LogLevel {
  return value === "debug" || value === "info" || value === "warn" || value === "error"
}

/**
 * Minimum level to emit.
 *
 * Read lazily (not cached at module load) so tests and server runtimes can
 * change NEXT_PUBLIC_LOG_LEVEL without needing a fresh module registry.
 */
function minLevel(): LogLevel {
  const configured = process.env.NEXT_PUBLIC_LOG_LEVEL
  if (isLogLevel(configured)) return configured
  return process.env.NODE_ENV === "production" ? "info" : "debug"
}

/** Turns an unknown thrown value into a serializable shape. */
export function normalizeError(error: unknown): NormalizedError {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack }
  }
  if (typeof error === "string") {
    return { name: "Error", message: error }
  }
  if (error && typeof error === "object") {
    // Supabase and fetch wrappers commonly reject with a plain
    // `{ message, code }` object rather than an Error instance.
    const maybe = error as { name?: unknown; message?: unknown; stack?: unknown }
    return {
      name: typeof maybe.name === "string" ? maybe.name : "Error",
      message: typeof maybe.message === "string" ? maybe.message : safeStringify(error),
      stack: typeof maybe.stack === "string" ? maybe.stack : undefined,
    }
  }
  return { name: "Error", message: String(error) }
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value) ?? String(value)
  } catch {
    // Circular structures, BigInt, etc.
    return String(value)
  }
}

let errorReporter: ErrorReporter | null = null

/**
 * Registers the sink that receives every `error`-level record.
 * Pass `null` to remove it. Returns the previous reporter so callers (and
 * tests) can restore it.
 */
export function setErrorReporter(reporter: ErrorReporter | null): ErrorReporter | null {
  const previous = errorReporter
  errorReporter = reporter
  return previous
}

/** Console method used per level. `debug` goes to console.log for readability. */
const CONSOLE_METHOD: Record<LogLevel, "log" | "warn" | "error"> = {
  debug: "log",
  info: "log",
  warn: "warn",
  error: "error",
}

function emit(record: LogRecord): void {
  if (LEVEL_WEIGHT[record.level] < LEVEL_WEIGHT[minLevel()]) return

  const prefix = record.scope ? `[${record.level}] ${record.scope}:` : `[${record.level}]`

  const details: unknown[] = []
  if (record.error) details.push(record.error)
  if (record.context && Object.keys(record.context).length > 0) details.push(record.context)

  // eslint-disable-next-line no-console
  console[CONSOLE_METHOD[record.level]](prefix, record.message, ...details)

  if (record.level === "error" && errorReporter) {
    try {
      errorReporter(record)
    } catch {
      // A failing reporter must never break the code path that logged.
    }
  }
}

export interface Logger {
  debug(message: string, context?: LogContext): void
  info(message: string, context?: LogContext): void
  /** `warn`/`error` accept an optional error as the second argument. */
  warn(message: string, error?: unknown, context?: LogContext): void
  error(message: string, error?: unknown, context?: LogContext): void
  /** Returns a logger whose scope is nested under this one. */
  child(scope: string): Logger
}

function createLogger(scope?: string): Logger {
  return {
    debug(message, context) {
      emit({ level: "debug", scope, message, context })
    },
    info(message, context) {
      emit({ level: "info", scope, message, context })
    },
    warn(message, error, context) {
      emit({
        level: "warn",
        scope,
        message,
        context,
        error: error === undefined ? undefined : normalizeError(error),
      })
    },
    error(message, error, context) {
      emit({
        level: "error",
        scope,
        message,
        context,
        error: error === undefined ? undefined : normalizeError(error),
      })
    },
    child(childScope) {
      return createLogger(scope ? `${scope}.${childScope}` : childScope)
    },
  }
}

export const logger: Logger = createLogger()
