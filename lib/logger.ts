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

/**
 * How a record is written to the console.
 *
 * `json` emits one machine-parseable line per record, which is what a log
 * collector needs -- the app is deployed to Cloud Run, where stdout is ingested
 * by Cloud Logging and a JSON line becomes a structured entry with queryable
 * fields instead of an opaque string.
 *
 * `pretty` is the multi-argument console form, which is far easier to read in a
 * terminal and lets a browser console expand the error and context objects.
 */
export type LogFormat = "pretty" | "json"

/**
 * Format to emit in.
 *
 * Read lazily for the same reason as `minLevel`. Defaults to `json` in
 * production (where something is collecting the output) and `pretty` everywhere
 * else (where a human is reading it).
 */
export function logFormat(): LogFormat {
  const configured = process.env.NEXT_PUBLIC_LOG_FORMAT
  if (configured === "json" || configured === "pretty") return configured
  return process.env.NODE_ENV === "production" ? "json" : "pretty"
}

/**
 * Cloud Logging severity per level.
 *
 * These exact strings matter: Cloud Logging promotes a JSON payload's
 * `severity` field to the entry's own severity, so an error shows up as an
 * error rather than as INFO text that happens to say "error".
 */
const SEVERITY: Record<LogLevel, string> = {
  debug: "DEBUG",
  info: "INFO",
  warn: "WARNING",
  error: "ERROR",
}

/**
 * One log record as a JSON-serializable object.
 *
 * Field names follow the Cloud Logging structured-log convention
 * (`severity`, `message`, `timestamp`) so no log-router mapping is needed;
 * `module` carries the logger's scope.
 */
export interface StructuredLogEntry {
  severity: string
  message: string
  /** The logger's dotted scope, omitted for the root logger. */
  module?: string
  /** ISO 8601, UTC. */
  timestamp: string
  context?: LogContext
  error?: NormalizedError
}

/**
 * Projects a record into its structured form.
 *
 * Exported so the error-tracking transport sends the same shape that is logged,
 * and so the shape can be asserted directly in tests. Empty `context` and
 * absent `error` are omitted rather than serialized as empty values, keeping
 * lines small and queries simple.
 */
export function toStructuredEntry(record: LogRecord, now: Date = new Date()): StructuredLogEntry {
  const entry: StructuredLogEntry = {
    severity: SEVERITY[record.level],
    message: record.message,
    timestamp: now.toISOString(),
  }

  if (record.scope) entry.module = record.scope
  if (record.context && Object.keys(record.context).length > 0) entry.context = record.context
  if (record.error) entry.error = record.error

  return entry
}

/**
 * Serializes an entry to a single JSON line.
 *
 * A caller's `context` is arbitrary — a React event, a DOM node, an object with
 * a cycle — and any of those make `JSON.stringify` throw. Losing the whole line
 * because the metadata was awkward would be the wrong trade, so the message and
 * severity are always emitted and only the unserializable part is replaced.
 */
export function serializeEntry(entry: StructuredLogEntry): string {
  try {
    return JSON.stringify(entry)
  } catch {
    return JSON.stringify({ ...entry, context: { unserializable: safeStringify(entry.context) } })
  }
}

function emit(record: LogRecord): void {
  if (LEVEL_WEIGHT[record.level] < LEVEL_WEIGHT[minLevel()]) return

  const method = CONSOLE_METHOD[record.level]

  if (logFormat() === "json") {
    // eslint-disable-next-line no-console
    console[method](serializeEntry(toStructuredEntry(record)))
  } else {
    const prefix = record.scope ? `[${record.level}] ${record.scope}:` : `[${record.level}]`

    const details: unknown[] = []
    if (record.error) details.push(record.error)
    if (record.context && Object.keys(record.context).length > 0) details.push(record.context)

    // eslint-disable-next-line no-console
    console[method](prefix, record.message, ...details)
  }

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
